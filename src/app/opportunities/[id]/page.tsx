import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CheckCircle2, FileText, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OpportunityAiPanel } from "@/components/opportunity-ai-panel";
import { OpportunityDetailClient } from "@/components/opportunity-detail-client";
import { Badge, Panel, ScoreRing } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { getOpportunityById } from "@/lib/opportunity-data";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOpportunityById(decodeURIComponent(id));
  const opportunity = data.opportunity;
  if (!opportunity) notFound();

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3">
        <Link href="/opportunities" className="text-sm font-semibold text-steel">
          Oportunidades
        </Link>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="info">{opportunity.source}</Badge>
              <Badge>{opportunity.processState}</Badge>
              <Badge tone={opportunity.fitScore.level === "Alto" ? "success" : "warning"}>{opportunity.fitScore.level}</Badge>
            </div>
            <h1 className="max-w-5xl text-3xl font-semibold text-ink">{opportunity.title}</h1>
            <p className="mt-3 text-stone-600">
              {opportunity.entity} · {opportunity.municipality}, {opportunity.department}
            </p>
          </div>
          <a className="focus-ring rounded-md bg-coal px-4 py-2 text-sm font-semibold text-white" href={opportunity.officialUrl} target="_blank">
            <span className="inline-flex items-center gap-2">
              Abrir fuente oficial <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <OpportunityDetailClient opportunityId={opportunity.sourceId} />

          <Panel>
            <h2 className="text-lg font-semibold">Resumen IA inicial</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">{opportunity.aiSummary ?? "Ejecuta el analisis IA para generar un resumen estructurado."}</p>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold">Requisitos extraidos</h2>
            <div className="mt-4 space-y-3">
              {opportunity.requirements?.length ? (
                opportunity.requirements.map((requirement) => (
                  <div key={`${requirement.category}-${requirement.text}`} className="rounded-md border border-stone-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{requirement.category}</Badge>
                      <Badge tone={requirement.risk === "Alto" ? "danger" : requirement.risk === "Medio" ? "warning" : "success"}>
                        Riesgo {requirement.risk}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-stone-700">{requirement.text}</p>
                    <p className="mt-2 text-xs font-semibold text-stone-500">{requirement.citation}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-600">Aun no hay documentos procesados para este proceso.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold">Documentos</h2>
            <div className="mt-4 space-y-3">
              {opportunity.documents.length ? (
                opportunity.documents.map((document) => (
                  <a key={document.id} href={document.url} className="flex items-center justify-between rounded-md border border-stone-200 p-3 text-sm hover:bg-stone-50">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4 text-steel" />
                      {document.name}
                    </span>
                    <span className="text-stone-500">{document.type}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-stone-600">La ingesta de archivos SECOP queda lista para conectar con Supabase Storage.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <div className="flex items-center gap-4">
              <ScoreRing score={opportunity.fitScore.score} />
              <div>
                <div className="text-sm text-stone-500">Encaje CAMOD</div>
                <div className="text-xl font-semibold">{opportunity.fitScore.level}</div>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {opportunity.fitScore.reasons.map((reason) => (
                <div key={reason} className="flex gap-2 text-sm text-stone-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  {reason}
                </div>
              ))}
              {opportunity.fitScore.risks.map((risk) => (
                <div key={risk} className="flex gap-2 text-sm text-stone-700">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  {risk}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-semibold">Datos clave</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Cuantia" value={money(opportunity.estimatedValue)} />
              <Row label="Modalidad" value={opportunity.modality} />
              <Row label="Tipo" value={opportunity.contractType} />
              <Row label="Publicado" value={shortDate(opportunity.publicationDate)} />
              <Row label="Cierre" value={shortDate(opportunity.deadline)} />
              <Row label="ID fuente" value={opportunity.sourceId} />
            </dl>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
