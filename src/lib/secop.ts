import type { Opportunity, SecopProcessRow } from "@/lib/types";
import { camodProfile } from "@/lib/company-profile";
import { scoreOpportunity } from "@/lib/scoring";
import { secopSearchUrl } from "@/lib/secop-links";

const SECOP_II_DATASET = "p6dx-8zbt";

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "url" in value) return stringifyValue((value as { url?: unknown }).url);
  return "";
}

function valueOf(row: SecopProcessRow, keys: string[]) {
  for (const key of keys) {
    const value = stringifyValue(row[key]).trim();
    if (value) return value;
  }
  return "";
}

function numberOf(row: SecopProcessRow, keys: string[]) {
  const raw = valueOf(row, keys).replace(/[^\d.-]/g, "");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validOfficialUrl(url: string, sourceId: string) {
  if (!url || url.includes("/STS/Users/Login")) return secopSearchUrl(sourceId);
  return url;
}

function fallbackDeadline(row: SecopProcessRow) {
  const explicit = valueOf(row, [
    "fecha_de_recepcion_de",
    "fecha_de_recepcion_de_respuestas",
    "fecha_de_apertura_de_respuesta",
    "fecha_de_apertura_efectiva"
  ]);
  if (explicit) return explicit;

  const publication = valueOf(row, ["fecha_de_publicacion_del", "fecha_de_ultima_publicaci", "fecha_de_publicacion"]);
  if (!publication) return new Date().toISOString();
  const date = new Date(publication);
  date.setDate(date.getDate() + 15);
  return date.toISOString();
}

function titleFrom(row: SecopProcessRow) {
  return (
    valueOf(row, ["descripci_n_del_procedimiento", "descripcion_del_procedimiento", "nombre_del_procedimiento", "objeto_del_contrato"]) ||
    "Proceso sin objeto publicado"
  );
}

export function normalizeSecopProcess(row: SecopProcessRow): Opportunity {
  const sourceId = valueOf(row, ["id_del_portafolio", "id_proceso", "id_del_proceso", "referencia_del_proceso"]) || crypto.randomUUID();
  const title = titleFrom(row);
  const department = valueOf(row, ["departamento_entidad", "departamento", "departamento_ejecucion"]) || "Sin departamento";
  const rawUrl = valueOf(row, ["urlproceso", "url_proceso"]);
  const base = {
    id: sourceId,
    source: "SECOP II" as const,
    sourceId,
    title,
    entity: valueOf(row, ["entidad", "nombre_entidad", "entidad_estatal"]) || "Entidad no disponible",
    department,
    municipality: valueOf(row, ["ciudad_entidad", "municipio", "municipio_ejecucion", "ciudad_de_la_unidad_de"]) || "Sin municipio",
    modality: valueOf(row, ["modalidad_de_contratacion", "modalidad"]) || "Sin modalidad",
    contractType: valueOf(row, ["tipo_de_contrato", "tipo_contrato"]) || "Sin tipo",
    estimatedValue: numberOf(row, ["precio_base", "valor_estimado", "valor_del_contrato", "valor_total_adjudicacion"]),
    publicationDate: valueOf(row, ["fecha_de_publicacion_del", "fecha_de_ultima_publicaci", "fecha_de_publicacion"]) || new Date().toISOString(),
    deadline: fallbackDeadline(row),
    status: "Nuevo" as const,
    processState: valueOf(row, ["estado_resumen", "estado_del_procedimiento", "estado"]) || "Publicado",
    officialUrl: validOfficialUrl(rawUrl, sourceId),
    keywords: [
      ...title.split(/\s+/).slice(0, 16),
      valueOf(row, ["codigo_principal_de_categoria"]),
      valueOf(row, ["tipo_de_contrato"])
    ].filter(Boolean),
    documents: []
  };

  return {
    ...base,
    fitScore: scoreOpportunity(base, camodProfile)
  };
}

export async function fetchSecopOpportunities(limit = 30) {
  const url = new URL("https://www.datos.gov.co/resource/" + SECOP_II_DATASET + ".json");
  const today = new Date().toISOString().slice(0, 10) + "T00:00:00";
  const sectorWhere = "upper(descripci_n_del_procedimiento) like '%OBRA%' OR upper(descripci_n_del_procedimiento) like '%INTERVENTORIA%' OR upper(descripci_n_del_procedimiento) like '%CONSULTORIA%' OR upper(descripci_n_del_procedimiento) like '%ARQUITECT%' OR upper(nombre_del_procedimiento) like '%OBRA%' OR upper(nombre_del_procedimiento) like '%INTERVENTORIA%' OR upper(nombre_del_procedimiento) like '%CONSULTORIA%' OR upper(nombre_del_procedimiento) like '%ARQUITECT%' OR tipo_de_contrato in('Obra','Interventoría','Consultoría')";

  url.searchParams.set("$limit", String(limit));
  url.searchParams.set("$select", "entidad,departamento_entidad,ciudad_entidad,id_del_proceso,id_del_portafolio,referencia_del_proceso,nombre_del_procedimiento,descripci_n_del_procedimiento,fecha_de_publicacion_del,fecha_de_ultima_publicaci,precio_base,modalidad_de_contratacion,fecha_de_recepcion_de,fecha_de_apertura_de_respuesta,fecha_de_apertura_efectiva,estado_del_procedimiento,estado_de_apertura_del_proceso,tipo_de_contrato,urlproceso,estado_resumen,codigo_principal_de_categoria");
  url.searchParams.set("$order", "fecha_de_recepcion_de ASC");
  url.searchParams.set("$where", "fecha_de_recepcion_de >= '" + today + "' AND estado_resumen != 'Adjudicado' AND estado_del_procedimiento != 'Cancelado' AND (" + sectorWhere + ")");

  const response = await fetch(url, {
    headers: process.env.SECOP_SOCRATA_APP_TOKEN ? { "X-App-Token": process.env.SECOP_SOCRATA_APP_TOKEN } : undefined,
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error("SECOP request failed: " + response.status + " " + body.slice(0, 240));
  }

  const rows = (await response.json()) as SecopProcessRow[];
  const seen = new Set<string>();
  return rows.map(normalizeSecopProcess).filter((opportunity) => {
    if (seen.has(opportunity.sourceId)) return false;
    seen.add(opportunity.sourceId);
    return true;
  });
}
