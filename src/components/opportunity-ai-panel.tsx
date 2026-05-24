"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import type { OpportunityAiAnalysis } from "@/lib/types";

type ApiResponse = {
  source: string;
  persisted: boolean;
  persistenceMessage?: string;
  analysis: OpportunityAiAnalysis;
};

type SavedAnalysisResponse = {
  found: boolean;
  analysis?: OpportunityAiAnalysis;
  createdAt?: string;
  message?: string;
};

export function OpportunityAiPanel({ opportunityId, analysis: externalAnalysis, status: externalStatus }: { opportunityId: string; analysis?: OpportunityAiAnalysis | null; status?: string | null }) {
  const [analysis, setAnalysis] = useState<OpportunityAiAnalysis | null>(externalAnalysis ?? null);
  const [status, setStatus] = useState<string | null>(externalStatus ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalAnalysis) setAnalysis(externalAnalysis);
    if (externalStatus) setStatus(externalStatus);
  }, [externalAnalysis, externalStatus]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedAnalysis() {
      try {
        const response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/analyze`);
        const payload = (await response.json()) as SavedAnalysisResponse;
        if (!cancelled && response.ok && payload.found && payload.analysis) {
          setAnalysis(payload.analysis);
          setStatus(payload.createdAt ? `Analisis guardado: ${new Date(payload.createdAt).toLocaleString("es-CO")}` : "Analisis guardado");
        }
      } catch {
        // Saved analyses are optional; ignore loading failures here.
      }
    }

    loadSavedAnalysis();
    return () => {
      cancelled = true;
    };
  }, [opportunityId]);

  async function analyze() {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/analyze`, { method: "POST" });
      const payload = (await response.json()) as ApiResponse | { message?: string };
      if (!response.ok || !("analysis" in payload)) {
        throw new Error("message" in payload && payload.message ? payload.message : "No fue posible analizar la oportunidad.");
      }
      setAnalysis(payload.analysis);
      setStatus(payload.persisted ? "Analisis generado y guardado en Supabase" : payload.persistenceMessage ? `Analisis generado, pero no guardado: ${payload.persistenceMessage}` : "Analisis generado");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible analizar la oportunidad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="ai-analysis-panel"><Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Analisis IA de licitacion</h2>
          <p className="mt-1 text-sm text-stone-600">Extrae documentos requeridos, requisitos habilitantes, UNSPSC, equipo, experiencia y riesgos.</p>
        </div>
        <button onClick={analyze} disabled={loading} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-coal px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Analizando" : "Analizar con IA"}
        </button>
      </div>

      {status ? <div className="mt-4"><Badge tone="success">{status}</Badge></div> : null}
      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      {!analysis && !loading ? (
        <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          Todavia no hay analisis cargado para esta oportunidad. Haz clic en <span className="font-semibold">Analizar con IA</span> y espera a que termine la solicitud.
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-md border border-amber/30 bg-amber/10 p-4 text-sm text-amber-900">
          Analizando metadatos SECOP con OpenAI. Esto puede tardar entre 10 y 30 segundos.
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-6 space-y-6">
          <Section title="Resumen ejecutivo">
            <p className="text-sm leading-6 text-stone-700">{analysis.executiveSummary}</p>
            <div className="mt-3"><Badge tone={analysis.recommendation === "No presentarse" ? "danger" : "warning"}>{analysis.recommendation}</Badge></div>
          </Section>

          <ListSection title="Razones de recomendacion" items={analysis.recommendationReasons} />
          <DocumentSection documents={analysis.requiredDocuments} />
          <RequirementsSection requirements={analysis.habilitatingRequirements} />
          <UnspscSection codes={analysis.unspscCodes} />
          <TeamSection team={analysis.requiredTeam} />
          <ListSection title="Experiencia requerida" items={analysis.requiredExperience} />
          <ListSection title="Riesgos y alertas" items={analysis.risks} danger />
          <ListSection title="Siguientes acciones" items={analysis.nextActions} />
          <ListSection title="Limitaciones" items={analysis.limitations} />
        </div>
      ) : null}
    </Panel></div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">{title}</h3>{children}</section>;
}

function ListSection({ title, items, danger = false }: { title: string; items: string[]; danger?: boolean }) {
  if (!items.length) return null;
  return <Section title={title}><ul className="space-y-2 text-sm text-stone-700">{items.map((item) => <li key={item} className="rounded-md border border-stone-200 p-3">{danger ? <Badge tone="danger">Riesgo</Badge> : null}<span className={danger ? "ml-2" : ""}>{item}</span></li>)}</ul></Section>;
}

function DocumentSection({ documents }: { documents: OpportunityAiAnalysis["requiredDocuments"] }) {
  return <Section title="Documentos requeridos para presentar"><div className="grid gap-3 md:grid-cols-2">{documents.map((doc) => <div key={doc.name} className="rounded-md border border-stone-200 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{doc.name}</span><Badge tone={doc.status === "requerido" ? "success" : doc.status === "opcional" ? "info" : "warning"}>{doc.status.replaceAll("_", " ")}</Badge></div><p className="mt-2 text-stone-600">{doc.notes}</p></div>)}</div></Section>;
}

function RequirementsSection({ requirements }: { requirements: OpportunityAiAnalysis["habilitatingRequirements"] }) {
  return <Section title="Requisitos habilitantes"><div className="grid gap-3 md:grid-cols-2">{Object.entries(requirements).map(([category, items]) => <div key={category} className="rounded-md border border-stone-200 p-3"><div className="font-semibold capitalize">{category}</div><ul className="mt-2 space-y-2 text-sm text-stone-700">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}</div></Section>;
}

function UnspscSection({ codes }: { codes: OpportunityAiAnalysis["unspscCodes"] }) {
  return <Section title="Codigos UNSPSC"><div className="space-y-2">{codes.map((code) => <div key={`${code.code}-${code.description}`} className="rounded-md border border-stone-200 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{code.code}</span><Badge tone={code.status === "detectado" ? "success" : "warning"}>{code.status.replaceAll("_", " ")}</Badge></div><p className="mt-2 text-stone-600">{code.description}</p></div>)}</div></Section>;
}

function TeamSection({ team }: { team: OpportunityAiAnalysis["requiredTeam"] }) {
  return <Section title="Equipo minimo requerido"><div className="space-y-3">{team.map((member) => <div key={`${member.role}-${member.profession}`} className="rounded-md border border-stone-200 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{member.role}</span><Badge tone={member.status === "detectado" ? "success" : "warning"}>{member.status.replaceAll("_", " ")}</Badge></div><p className="mt-2 text-stone-700">{member.profession} · {member.experience} · {member.dedication}</p><p className="mt-2 text-stone-600">Soportes: {member.documents.join(", ")}</p></div>)}</div></Section>;
}
