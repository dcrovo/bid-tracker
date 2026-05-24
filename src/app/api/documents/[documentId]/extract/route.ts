import { NextResponse } from "next/server";
import { extractDocument } from "@/lib/documents";

export async function POST(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  try {
    const document = await extractDocument(decodeURIComponent(documentId));
    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Document extraction failed." }, { status: 500 });
  }
}
