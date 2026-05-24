import { getOpportunityById } from "@/lib/opportunity-data";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import type { BidDocument, DocumentAiContext, Opportunity } from "@/lib/types";

const MAX_EXTRACTED_CHARS = 120_000;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const DOCUMENT_BUCKET = "opportunity-documents";

function mapDbDocument(row: Record<string, unknown>): BidDocument {
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id ?? ""),
    name: String(row.name ?? "Documento"),
    type: (String(row.document_type ?? "Otro") as BidDocument["type"]),
    url: String(row.source_url ?? ""),
    storagePath: (row.storage_path as string | null) ?? null,
    extractionStatus: (row.extraction_status as BidDocument["extractionStatus"]) ?? "pending",
    extractedText: (row.extracted_text as string | null) ?? null,
    extractedAt: (row.extracted_at as string | null) ?? null,
    extractionError: (row.extraction_error as string | null) ?? null,
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString())
  };
}

function inferDocumentType(nameOrUrl: string): BidDocument["type"] {
  const text = nameOrUrl.toLowerCase();
  if (text.includes("pliego")) return "Pliego";
  if (text.includes("adenda") || text.includes("addenda")) return "Adenda";
  if (text.includes("estudio")) return "Estudios previos";
  if (text.includes("informe")) return "Informe";
  return "Otro";
}

export async function listDocuments(opportunityId: string): Promise<BidDocument[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapDbDocument(row as Record<string, unknown>));
}

export async function discoverDocumentsForOpportunity(opportunityId: string): Promise<BidDocument[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { opportunity } = await getOpportunityById(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found.");

  const candidates = buildDocumentCandidates(opportunity);
  for (const candidate of candidates) {
    await supabase.from("documents").upsert(
      {
        opportunity_id: opportunity.sourceId,
        name: candidate.name,
        document_type: candidate.type,
        source_url: candidate.url,
        extraction_status: candidate.url === opportunity.officialUrl ? "unavailable" : "pending",
        extraction_error:
          candidate.url === opportunity.officialUrl
            ? "SECOP document files are not exposed in current metadata. Open official source to download pliegos manually, paste a direct document URL, or upload the file from your PC."
            : null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "opportunity_id,source_url" }
    );
  }

  return listDocuments(opportunity.sourceId);
}

function buildDocumentCandidates(opportunity: Opportunity): Array<{ name: string; type: BidDocument["type"]; url: string }> {
  const existing = opportunity.documents.map((document) => ({ name: document.name, type: document.type, url: document.url }));
  if (existing.length) return existing;

  return [
    {
      name: "Fuente oficial SECOP - revisar documentos del proceso",
      type: "Otro",
      url: opportunity.officialUrl
    }
  ];
}

export async function registerManualDocumentUrl(
  opportunityId: string,
  input: { name?: string; url?: string; type?: string }
): Promise<BidDocument[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const url = input.url?.trim();
  if (!url) throw new Error("Document URL is required.");
  try {
    new URL(url);
  } catch {
    throw new Error("Document URL is invalid.");
  }

  const name = input.name?.trim() || url.split("/").pop() || "Documento manual";
  const type = (input.type?.trim() || inferDocumentType(`${name} ${url}`)) as BidDocument["type"];

  const { error } = await supabase.from("documents").upsert(
    {
      opportunity_id: opportunityId,
      name,
      document_type: type,
      source_url: url,
      extraction_status: "pending",
      extraction_error: null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "opportunity_id,source_url" }
  );

  if (error) throw new Error(error.message);
  return listDocuments(opportunityId);
}

export async function uploadDocumentFile(
  opportunityId: string,
  file: File,
  input: { name?: string; type?: string }
): Promise<BidDocument[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  if (file.size <= 0) throw new Error("Uploaded file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Uploaded file exceeds 25 MB limit.");

  const mimeType = file.type || "application/octet-stream";
  const originalName = input.name?.trim() || file.name || "Documento cargado";
  const lowerName = originalName.toLowerCase();
  const supported = mimeType.includes("pdf") || mimeType.startsWith("text/") || lowerName.endsWith(".pdf") || lowerName.endsWith(".txt");
  if (!supported) throw new Error("Only PDF and text files are supported in this version.");

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const storagePath = `${opportunityId}/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(storagePath, bytes, {
    contentType: mimeType,
    upsert: false
  });
  if (uploadError) throw new Error(uploadError.message);

  const sourceUrl = `storage://${DOCUMENT_BUCKET}/${storagePath}`;
  const { error } = await supabase.from("documents").insert({
    opportunity_id: opportunityId,
    name: originalName,
    document_type: input.type || inferDocumentType(originalName),
    source_url: sourceUrl,
    storage_path: storagePath,
    extraction_status: "pending",
    extraction_error: null,
    updated_at: new Date().toISOString()
  });

  if (error) throw new Error(error.message);
  return listDocuments(opportunityId);
}

export async function extractDocument(documentId: string): Promise<BidDocument> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.from("documents").select("*").eq("id", documentId).single();
  if (error || !data) throw new Error(error?.message || "Document not found.");

  const document = mapDbDocument(data as Record<string, unknown>);
  try {
    if (!document.url || document.extractionStatus === "unavailable") {
      throw new Error(document.extractionError || "Document URL is unavailable for extraction.");
    }

    const extractedText = document.storagePath ? await extractTextFromStorage(document.storagePath) : await extractTextFromUrl(document.url);
    const storagePath = document.storagePath ?? (await tryStoreSourceDocument(supabase, document, document.url));
    const { data: updated, error: updateError } = await supabase
      .from("documents")
      .update({
        storage_path: storagePath ?? document.storagePath,
        extraction_status: "extracted",
        extracted_text: extractedText,
        extracted_at: new Date().toISOString(),
        extraction_error: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", documentId)
      .select("*")
      .single();

    if (updateError || !updated) throw new Error(updateError?.message || "Could not update document extraction.");
    return mapDbDocument(updated as Record<string, unknown>);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Document extraction failed.";
    await supabase
      .from("documents")
      .update({ extraction_status: "failed", extraction_error: message, updated_at: new Date().toISOString() })
      .eq("id", documentId);
    throw new Error(message);
  }
}

async function extractTextFromStorage(storagePath: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).download(storagePath);
  if (error || !data) throw new Error(error?.message || "Could not download stored document.");

  const buffer = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || "";
  return extractTextFromBuffer(buffer, contentType, storagePath);
}

async function extractTextFromUrl(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "CAMOD Licitaciones Document Extractor" } });
  if (!response.ok) throw new Error(`Could not download document: HTTP ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());
  return extractTextFromBuffer(buffer, contentType, url);
}

async function extractTextFromBuffer(buffer: Buffer, contentType: string, sourceName: string) {
  let text = "";

  if (contentType.includes("pdf") || sourceName.toLowerCase().includes(".pdf")) {
    text = await extractPdfText(buffer);
  } else if (contentType.includes("text") || contentType.includes("json") || contentType.includes("html") || sourceName.toLowerCase().endsWith(".txt")) {
    text = buffer.toString("utf8");
  } else {
    throw new Error(`Unsupported document content type: ${contentType || "unknown"}`);
  }

  const normalized = text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) throw new Error("No text could be extracted from document.");
  return normalized.slice(0, MAX_EXTRACTED_CHARS);
}

async function extractPdfText(buffer: Buffer) {
  const runtimeRequire = eval("require") as NodeRequire;
  const { PDFParse } = runtimeRequire("pdf-parse") as { PDFParse: new (options: { data: Buffer }) => { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> | void } };
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text || "";
  } finally {
    await parser.destroy();
  }
}

async function tryStoreSourceDocument(supabase: NonNullable<ReturnType<typeof getSupabaseServiceClient>>, document: BidDocument, url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    const extension = url.toLowerCase().includes(".pdf") ? "pdf" : "bin";
    const path = `${document.opportunityId ?? "unknown"}/${document.id}.${extension}`;
    const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, bytes, { upsert: true });
    if (error) return null;
    return path;
  } catch {
    return null;
  }
}

export async function getDocumentAiContexts(opportunityId: string): Promise<DocumentAiContext[]> {
  const documents = await listDocuments(opportunityId);
  return documents
    .filter((document) => document.extractionStatus === "extracted" && document.extractedText)
    .map((document) => ({
      documentId: document.id,
      name: document.name,
      type: document.type,
      sourceUrl: document.url,
      text: document.extractedText ?? ""
    }));
}
