"use client";

import { useEffect, useState } from "react";
import { Brain, DownloadCloud, FileSearch, Loader2, Upload } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import type { BidDocument, OpportunityAiAnalysis } from "@/lib/types";

type DocumentsResponse = { documents: BidDocument[]; message?: string };
type AnalysisResponse = { analysis: OpportunityAiAnalysis; persisted: boolean; persistenceMessage?: string; message?: string };

export function OpportunityDocumentsPanel({ opportunityId, onAnalysis }: { opportunityId: string; onAnalysis: (analysis: OpportunityAiAnalysis, status: string) => void }) {
  const [documents, setDocuments] = useState<BidDocument[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [manualName, setManualName] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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
      setMessage("Busqueda oficial ejecutada. Si SECOP no expone archivos directos, agrega URL directa o sube el pliego.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible descubrir documentos.");
    } finally {
      setLoading(null);
    }
  }

  async function addManualDocument() {
    setLoading("manual-url");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl, name: manualName })
      });
      const payload = (await response.json()) as DocumentsResponse;
      if (!response.ok) throw new Error(payload.message || "No fue posible agregar la URL.");
      setDocuments(payload.documents ?? []);
      setManualUrl("");
      setManualName("");
      setMessage("Documento agregado por URL. Ahora puedes extraer texto.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible agregar la URL.");
    } finally {
      setLoading(null);
    }
  }

  async function uploadDocument() {
    if (!uploadFile) return;
    setLoading("upload");
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", uploadFile);
      if (uploadName.trim()) form.set("name", uploadName.trim());
      const response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/documents/upload`, {
        method: "POST",
        body: form
      });
      const payload = (await response.json()) as DocumentsResponse;
      if (!response.ok) throw new Error(payload.message || "No fue posible subir el archivo.");
      setDocuments(payload.documents ?? []);
      setUploadName("");
      setUploadFile(null);
      setMessage("Archivo subido. Ahora puedes extraer texto.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible subir el archivo.");
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
      const status = payload.persisted ? "Analisis de documentos guardado en Supabase" : payload.persistenceMessage ? `Analisis generado, no guardado: ${payload.persistenceMessage}` : "Analisis de documentos generado";
      setAnalysisSummary(`${status}. Recomendacion: ${payload.analysis.recommendation}`);
      setMessage("Analisis de documentos completado. Revisa el panel de Analisis IA debajo.");
      onAnalysis(payload.analysis, status);
      window.setTimeout(() => document.getElementById("ai-analysis-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
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
          <p className="mt-1 text-sm text-stone-600">Primero intenta descubrir en SECOP. Si no hay archivo directo, pega una URL de documento o sube el PDF desde tu PC.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={discover} disabled={!!loading} className="focus-ring inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold">
            {loading === "discover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
            Descubrir en SECOP
          </button>
          <button onClick={analyzeDocuments} disabled={!!loading || extractedCount === 0} className="focus-ring inline-flex items-center gap-2 rounded-md bg-coal px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {loading === "analyze-documents" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analizar documentos
          </button>
        </div>
      </div>

      {message ? <div className="mt-4"><Badge tone="success">{message}</Badge></div> : null}
      {analysisSummary ? <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{analysisSummary}</div> : null}
      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      {loading === "analyze-documents" ? (
        <div className="mt-4 rounded-md border border-amber/30 bg-amber/10 p-3 text-sm text-amber-900">
          Analizando documentos extraidos con OpenAI. Esto puede tardar entre 20 y 60 segundos.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
          <div className="mb-3 text-sm font-semibold">Agregar URL directa</div>
          <div className="space-y-2">
            <input value={manualName} onChange={(event) => setManualName(event.target.value)} className="focus-ring w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm" placeholder="Nombre del documento" />
            <input value={manualUrl} onChange={(event) => setManualUrl(event.target.value)} className="focus-ring w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm" placeholder="URL del pliego/anexo PDF" />
            <button onClick={addManualDocument} disabled={!!loading || !manualUrl.trim()} className="focus-ring rounded-md bg-steel px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {loading === "manual-url" ? "Agregando" : "Agregar URL"}
            </button>
          </div>
        </div>

        <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
          <div className="mb-3 text-sm font-semibold">Subir desde el PC</div>
          <div className="space-y-2">
            <input value={uploadName} onChange={(event) => setUploadName(event.target.value)} className="focus-ring w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm" placeholder="Nombre opcional" />
            <input type="file" accept="application/pdf,text/plain,.pdf,.txt" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} className="focus-ring w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm" />
            <button onClick={uploadDocument} disabled={!!loading || !uploadFile} className="focus-ring inline-flex items-center gap-2 rounded-md bg-steel px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {loading === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {loading === "upload" ? "Subiendo" : "Subir archivo"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {documents.length ? documents.map((document) => (
          <div key={document.id} className="rounded-md border border-stone-200 p-3 text-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="font-semibold">{document.name}</div>
                <a href={document.url.startsWith("storage://") ? "#" : document.url} target="_blank" className="mt-1 block truncate text-xs text-steel">{document.url}</a>
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
          <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">No hay documentos registrados todavia. Usa Descubrir, agrega una URL directa o sube un PDF.</div>
        )}
      </div>
    </Panel>
  );
}
