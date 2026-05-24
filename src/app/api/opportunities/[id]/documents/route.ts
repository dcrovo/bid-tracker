import { NextResponse } from "next/server";
import { listDocuments, registerManualDocumentUrl } from "@/lib/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const documents = await listDocuments(decodeURIComponent(id));
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not list documents." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { name?: string; url?: string; type?: string };

  try {
    const documents = await registerManualDocumentUrl(decodeURIComponent(id), body);
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not register document URL." }, { status: 500 });
  }
}
