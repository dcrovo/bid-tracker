import { NextResponse } from "next/server";
import { analyzeOpportunityWithOpenAI } from "@/lib/opportunity-ai";
import { getOpportunityById } from "@/lib/opportunity-data";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunityId = decodeURIComponent(id);
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ found: false, message: "Supabase is not configured." });
  }

  const { data, error } = await supabase
    .from("ai_extractions")
    .select("summary,requirements,model,created_at")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ found: false, message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    analysis: data.requirements,
    summary: data.summary,
    model: data.model,
    createdAt: data.created_at
  });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { opportunity } = await getOpportunityById(decodeURIComponent(id));

  if (!opportunity) {
    return NextResponse.json({ message: "Opportunity not found." }, { status: 404 });
  }

  try {
    const analysis = await analyzeOpportunityWithOpenAI(opportunity);
    const supabase = getSupabaseServiceClient();
    let persisted = false;
    let persistenceMessage: string | undefined;

    if (supabase) {
      const { error } = await supabase.from("ai_extractions").insert({
        opportunity_id: opportunity.sourceId,
        summary: analysis.executiveSummary,
        requirements: analysis,
        model: process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_HEALTH_MODEL || "gpt-4.1-mini"
      });

      if (error) {
        persistenceMessage = error.message;
      } else {
        persisted = true;
      }
    }

    return NextResponse.json({
      source: process.env.OPENAI_API_KEY ? "openai" : "metadata_fallback",
      persisted,
      persistenceMessage,
      opportunityId: opportunity.sourceId,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Opportunity analysis failed." },
      { status: 502 }
    );
  }
}
