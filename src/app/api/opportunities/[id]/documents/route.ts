import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const documents = await listDocuments(decodeURIComponent(id));
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not list documents." }, { status: 500 });
  }
}
