import { NextResponse } from "next/server";
import { uploadDocumentFile } from "@/lib/documents";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const name = typeof form.get("name") === "string" ? String(form.get("name")) : undefined;
    const type = typeof form.get("type") === "string" ? String(form.get("type")) : undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "A file is required." }, { status: 400 });
    }

    const documents = await uploadDocumentFile(decodeURIComponent(id), file, { name, type });
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not upload document." }, { status: 500 });
  }
}
