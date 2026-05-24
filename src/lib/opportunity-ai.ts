import type { Opportunity, OpportunityAiAnalysis } from "@/lib/types";

export const DEFAULT_OPENAI_ANALYSIS_MODEL = "gpt-4.1-mini";

const fallbackDocuments = [
  "Carta de presentacion de la propuesta",
  "Certificado de existencia y representacion legal",
  "RUP vigente y en firme",
  "RUT",
  "Cedula del representante legal",
  "Garantia de seriedad de la oferta",
  "Estados financieros e indicadores habilitantes",
  "Certificaciones de experiencia especifica",
  "Hojas de vida y soportes del equipo minimo",
  "Propuesta economica",
  "Anexos tecnicos y formatos SECOP"
];

function extractUnspsc(opportunity: Opportunity) {
  return opportunity.keywords.filter((keyword) => /^V?1?\.?\d{6,10}$/i.test(keyword.replace(/\s/g, "")));
}

export function buildMetadataOnlyAnalysis(opportunity: Opportunity): OpportunityAiAnalysis {
  const codes = extractUnspsc(opportunity);
  return {
    executiveSummary: `${opportunity.title}. Entidad: ${opportunity.entity}. Modalidad: ${opportunity.modality}. Cuantia estimada: ${opportunity.estimatedValue}.`,
    recommendation: opportunity.fitScore.level === "Bajo" ? "No presentarse" : "Revisar primero",
    recommendationReasons: [...opportunity.fitScore.reasons, ...opportunity.fitScore.risks],
    requiredDocuments: fallbackDocuments.map((name) => ({
      name,
      status: "debe_verificarse_en_pliego",
      notes: "No se ha procesado el pliego; confirmar exigencia exacta en los documentos oficiales."
    })),
    habilitatingRequirements: {
      juridicos: ["Debe verificarse en pliego: capacidad juridica, existencia, representacion legal, inhabilidades e incompatibilidades."],
      financieros: ["Debe verificarse en pliego: liquidez, endeudamiento, capital de trabajo, patrimonio y capacidad organizacional."],
      tecnicos: ["Debe verificarse en pliego: experiencia especifica, contratos similares, cuantia acumulada y condiciones de acreditacion."],
      organizacionales: ["Debe verificarse en pliego: clasificaciones RUP/UNSPSC, indicadores y capacidad residual si aplica."]
    },
    unspscCodes: codes.length
      ? codes.map((code) => ({ code, description: "Codigo detectado en metadatos SECOP.", status: "detectado" }))
      : [{ code: "No detectado", description: "SECOP no entrego codigo en los metadatos usados por la app.", status: "debe_verificarse_en_pliego" }],
    requiredTeam: [
      {
        role: "Equipo minimo",
        profession: "Debe verificarse en pliego",
        experience: "Debe verificarse en pliego",
        dedication: "Debe verificarse en pliego",
        documents: ["Hoja de vida", "Diploma", "Tarjeta profesional", "Certificaciones de experiencia"],
        status: "debe_verificarse_en_pliego"
      }
    ],
    requiredExperience: ["Debe verificarse en pliego: numero de contratos, objeto similar, valor minimo, fechas y forma de acreditacion."],
    risks: opportunity.fitScore.risks.length ? opportunity.fitScore.risks : ["Analisis limitado a metadatos SECOP; falta revisar pliego."],
    nextActions: ["Abrir fuente oficial SECOP", "Descargar pliego y anexos", "Validar RUP/UNSPSC", "Validar indicadores financieros", "Asignar responsable de go/no-go"],
    limitations: ["Este analisis usa metadatos SECOP, no pliego completo.", "Los requisitos habilitantes definitivos deben extraerse de pliegos y anexos."]
  };
}

export function buildOpportunityAnalysisPrompt(opportunity: Opportunity) {
  return `Eres un analista senior de licitaciones publicas en Colombia para una empresa de construccion, arquitectura, interventoria y consultoria llamada CAMOD S.A.S.

Analiza esta oportunidad usando SOLO los metadatos disponibles. Si un dato requiere pliego, dilo explicitamente como "debe verificarse en pliego". No inventes indicadores, codigos UNSPSC, equipo minimo ni documentos que no esten en la informacion.

Metadatos:
- ID: ${opportunity.sourceId}
- Objeto: ${opportunity.title}
- Entidad: ${opportunity.entity}
- Departamento/Municipio: ${opportunity.department} / ${opportunity.municipality}
- Modalidad: ${opportunity.modality}
- Tipo de contrato: ${opportunity.contractType}
- Cuantia estimada: ${opportunity.estimatedValue}
- Fecha de publicacion: ${opportunity.publicationDate}
- Fecha limite: ${opportunity.deadline}
- Estado: ${opportunity.processState}
- Palabras/codigos detectados: ${opportunity.keywords.join(", ")}
- Score CAMOD: ${opportunity.fitScore.score} (${opportunity.fitScore.level})
- Razones score: ${opportunity.fitScore.reasons.join(" | ")}
- Riesgos score: ${opportunity.fitScore.risks.join(" | ") || "Ninguno"}

Devuelve JSON valido con esta forma exacta:
{
  "executiveSummary": "string",
  "recommendation": "Presentarse | Presentarse con aliado | Revisar primero | No presentarse",
  "recommendationReasons": ["string"],
  "requiredDocuments": [{"name":"string","status":"requerido | opcional | debe_verificarse_en_pliego","notes":"string"}],
  "habilitatingRequirements": {"juridicos":["string"],"financieros":["string"],"tecnicos":["string"],"organizacionales":["string"]},
  "unspscCodes": [{"code":"string","description":"string","status":"detectado | debe_verificarse_en_pliego"}],
  "requiredTeam": [{"role":"string","profession":"string","experience":"string","dedication":"string","documents":["string"],"status":"detectado | debe_verificarse_en_pliego"}],
  "requiredExperience": ["string"],
  "risks": ["string"],
  "nextActions": ["string"],
  "limitations": ["string"]
}`;
}

function parseAnalysis(payload: unknown, fallback: OpportunityAiAnalysis): OpportunityAiAnalysis {
  if (!payload || typeof payload !== "object") return fallback;
  const value = payload as Partial<OpportunityAiAnalysis>;
  return {
    ...fallback,
    ...value,
    habilitatingRequirements: {
      ...fallback.habilitatingRequirements,
      ...(value.habilitatingRequirements ?? {})
    }
  };
}

export async function analyzeOpportunityWithOpenAI(opportunity: Opportunity, fetchImpl: typeof fetch = fetch): Promise<OpportunityAiAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  const fallback = buildMetadataOnlyAnalysis(opportunity);

  if (!apiKey) return fallback;

  const model = process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_HEALTH_MODEL || DEFAULT_OPENAI_ANALYSIS_MODEL;
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: buildOpportunityAnalysisPrompt(opportunity),
      text: { format: { type: "json_object" } },
      max_output_tokens: 2200,
      store: false
    })
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const error = body?.error as { message?: string } | undefined;
    throw new Error(error?.message || `OpenAI analysis failed with HTTP ${response.status}.`);
  }

  const outputText = typeof body?.output_text === "string" ? body.output_text : "";
  if (!outputText) return fallback;

  try {
    return parseAnalysis(JSON.parse(outputText), fallback);
  } catch {
    return fallback;
  }
}

import type { DocumentAiContext } from "@/lib/types";

export function buildDocumentAnalysisPrompt(opportunity: Opportunity, documents: DocumentAiContext[]) {
  const documentText = documents
    .map((document, index) => `DOCUMENTO ${index + 1}: ${document.name}\nTIPO: ${document.type}\nURL: ${document.sourceUrl}\nTEXTO:\n${document.text.slice(0, 25000)}`)
    .join("\n\n---\n\n");

  return `Eres un analista senior de licitaciones publicas en Colombia para CAMOD S.A.S., empresa de construccion, arquitectura, interventoria y consultoria.

Usa los metadatos y los documentos extraidos para identificar requisitos reales. Cuando el dato venga del documento, incluye en notes, description o texto la referencia al documento. No inventes indicadores financieros, equipo minimo, experiencia ni codigos UNSPSC. Si no aparece claramente, escribe "debe verificarse manualmente en pliego/anexos".

Metadatos:
- ID: ${opportunity.sourceId}
- Objeto: ${opportunity.title}
- Entidad: ${opportunity.entity}
- Departamento/Municipio: ${opportunity.department} / ${opportunity.municipality}
- Modalidad: ${opportunity.modality}
- Tipo de contrato: ${opportunity.contractType}
- Cuantia estimada: ${opportunity.estimatedValue}
- Fecha limite: ${opportunity.deadline}
- Estado: ${opportunity.processState}

Documentos extraidos:
${documentText}

Devuelve JSON valido con esta forma exacta:
{
  "executiveSummary": "string",
  "recommendation": "Presentarse | Presentarse con aliado | Revisar primero | No presentarse",
  "recommendationReasons": ["string"],
  "requiredDocuments": [{"name":"string","status":"requerido | opcional | debe_verificarse_en_pliego","notes":"string con cita corta o nombre del documento"}],
  "habilitatingRequirements": {"juridicos":["string con fuente"],"financieros":["string con fuente"],"tecnicos":["string con fuente"],"organizacionales":["string con fuente"]},
  "unspscCodes": [{"code":"string","description":"string con fuente","status":"detectado | debe_verificarse_en_pliego"}],
  "requiredTeam": [{"role":"string","profession":"string","experience":"string","dedication":"string","documents":["string"],"status":"detectado | debe_verificarse_en_pliego"}],
  "requiredExperience": ["string con fuente"],
  "risks": ["string"],
  "nextActions": ["string"],
  "limitations": ["string"]
}`;
}

export async function analyzeOpportunityDocumentsWithOpenAI(
  opportunity: Opportunity,
  documents: DocumentAiContext[],
  fetchImpl: typeof fetch = fetch
): Promise<OpportunityAiAnalysis> {
  if (!documents.length) return buildMetadataOnlyAnalysis(opportunity);
  const apiKey = process.env.OPENAI_API_KEY;
  const fallback = buildMetadataOnlyAnalysis(opportunity);
  if (!apiKey) return { ...fallback, limitations: ["OPENAI_API_KEY no esta configurado.", ...fallback.limitations] };

  const model = process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_HEALTH_MODEL || DEFAULT_OPENAI_ANALYSIS_MODEL;
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: buildDocumentAnalysisPrompt(opportunity, documents),
      text: { format: { type: "json_object" } },
      max_output_tokens: 3500,
      store: false
    })
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const error = body?.error as { message?: string } | undefined;
    throw new Error(error?.message || `OpenAI document analysis failed with HTTP ${response.status}.`);
  }

  const outputText = typeof body?.output_text === "string" ? body.output_text : "";
  if (!outputText) return fallback;

  try {
    return parseAnalysis(JSON.parse(outputText), fallback);
  } catch {
    return fallback;
  }
}
