import { NextResponse } from "next/server";
import { getOpportunityData } from "@/lib/opportunity-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 30);
  const data = await getOpportunityData(limit);

  return NextResponse.json({
    source: data.source,
    label: data.label,
    message: data.message,
    generatedAt: data.generatedAt,
    count: data.opportunities.length,
    data: data.opportunities
  });
}
