import { NextResponse } from "next/server";
import { getDocumentAiContexts } from "@/lib/documents";
import { analyzeOpportunityDocumentsWithOpenAI } from "@/lib/opportunity-ai";
import { getOpportunityById } from "@/lib/opportunity-data";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunityId = decodeURIComponent(id);
  const { opportunity } = await getOpportunityById(opportunityId);
  if (!opportunity) return NextResponse.json({ message: "Opportunity not found." }, { status: 404 });

  try {
    const documents = await getDocumentAiContexts(opportunity.sourceId);
    if (!documents.length) {
      return NextResponse.json({ message: "No extracted documents are available for this opportunity." }, { status: 409 });
    }

    const analysis = await analyzeOpportunityDocumentsWithOpenAI(opportunity, documents);
    const supabase = getSupabaseServiceClient();
    let persisted = false;
    let persistenceMessage: string | undefined;

    if (supabase) {
      const { error } = await supabase.from("ai_extractions").insert({
        opportunity_id: opportunity.sourceId,
        summary: analysis.executiveSummary,
        requirements: { ...analysis, sourceType: "documents", documentIds: documents.map((document) => document.documentId) },
        model: process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_HEALTH_MODEL || "gpt-4.1-mini"
      });
      if (error) persistenceMessage = error.message;
      else persisted = true;
    }

    return NextResponse.json({ source: "documents", persisted, persistenceMessage, opportunityId: opportunity.sourceId, analysis });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Document analysis failed." }, { status: 502 });
  }
}
