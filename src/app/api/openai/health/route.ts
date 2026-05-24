import { NextResponse } from "next/server";
import { checkOpenAIHealth } from "@/lib/openai-health";

export async function GET() {
  const result = await checkOpenAIHealth();
  return NextResponse.json(result, { status: result.ok ? 200 : result.configured ? 502 : 200 });
}
