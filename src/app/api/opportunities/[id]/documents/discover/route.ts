import { NextResponse } from "next/server";
import { discoverDocumentsForOpportunity } from "@/lib/documents";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const documents = await discoverDocumentsForOpportunity(decodeURIComponent(id));
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Document discovery failed." }, { status: 500 });
  }
}
