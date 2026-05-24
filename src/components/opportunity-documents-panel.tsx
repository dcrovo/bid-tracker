"use client";

import { useEffect, useState } from "react";
import { Brain, DownloadCloud, FileSearch, Loader2 } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import type { BidDocument, OpportunityAiAnalysis } from "@/lib/types";

type DocumentsResponse = { documents: BidDocument[]; message?: string };
type AnalysisResponse = { analysis: OpportunityAiAnalysis; persisted: boolean; persistenceMessage?: string; message?: string };

export function OpportunityDocumentsPanel({ opportunityId, onAnalysis }: { opportunityId: string; onAnalysis: (analysis: OpportunityAiAnalysis, status: string) => void }) {
  const [documents, setDocuments] = useState<BidDocument[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  async function loadDocuments() {
    try {
      const response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/documents`);
      const payload = (await response.json()) as DocumentsResponse;
      if (response.ok) setDocuments(payload.documents ?? []);
    } catch {
      // Optional data; ignore initial load failures.
    }
  }

  async function discover() {
    setLoading("discover");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/documents/discover`, { method: "POST" });
      const payload = (await response.json()) as DocumentsResponse;
      if (!response.ok) throw new Error(payload.message || "No fue posible descubrir documentos.");
      setDocuments(payload.documents ?? []);
      setMessage("Documentos actualizados desde la informacion disponible.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible descubrir documentos.");
    } finally {
      setLoading(null);
    }
  }

  async function extract(documentId: string) {
    setLoading(documentId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/extract`, { method: "POST" });
      const payload = (await response.json()) as { document?: BidDocument; message?: string };
      if (!response.ok || !payload.document) throw new Error(payload.message || "No fue posible extraer texto.");
      await loadDocuments();
      setMessage("Texto extraido y guardado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible extraer texto.");
      await loadDocuments();
    } finally {
      setLoading(null);
    }
  }

  async function analyzeDocuments() {
    setLoading("analyze-documents");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/analyze-documents`, { method: "POST" });
      const payload = (await response.json()) as AnalysisResponse;
      if (!response.ok || !payload.analysis) throw new Error(payload.message || "No fue posible analizar documentos.");
      onAnalysis(payload.analysis, payload.persisted ? "Analisis de documentos guardado en Supabase" : payload.persistenceMessage ? `Analisis generado, no guardado: ${payload.persistenceMessage}` : "Analisis de documentos generado");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible analizar documentos.");
    } finally {
      setLoading(null);
    }
  }

  const extractedCount = documents.filter((document) => document.extractionStatus === "extracted").length;

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pliegos y documentos</h2>
          <p className="mt-1 text-sm text-stone-600">Descubre documentos, extrae texto y ejecuta analisis basado en pliegos cuando haya texto disponible.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={discover} disabled={!!loading} className="focus-ring inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold">
            {loading === "discover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
            Descubrir
          </button>
          <button onClick={analyzeDocuments} disabled={!!loading || extractedCount === 0} className="focus-ring inline-flex items-center gap-2 rounded-md bg-coal px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {loading === "analyze-documents" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analizar documentos
          </button>
        </div>
      </div>

      {message ? <div className="mt-4"><Badge tone="success">{message}</Badge></div> : null}
      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <div className="mt-5 space-y-3">
        {documents.length ? documents.map((document) => (
          <div key={document.id} className="rounded-md border border-stone-200 p-3 text-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="font-semibold">{document.name}</div>
                <a href={document.url} target="_blank" className="mt-1 block truncate text-xs text-steel">{document.url}</a>
                {document.extractionError ? <p className="mt-2 text-xs text-red-700">{document.extractionError}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge tone={document.extractionStatus === "extracted" ? "success" : document.extractionStatus === "failed" ? "danger" : document.extractionStatus === "unavailable" ? "warning" : "info"}>{document.extractionStatus ?? "pending"}</Badge>
                <button onClick={() => extract(document.id)} disabled={!!loading || document.extractionStatus === "unavailable"} className="focus-ring inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                  {loading === document.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DownloadCloud className="h-3.5 w-3.5" />}
                  Extraer
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">No hay documentos registrados todavia. Usa Descubrir para crear una referencia desde SECOP.</div>
        )}
      </div>
    </Panel>
  );
}
