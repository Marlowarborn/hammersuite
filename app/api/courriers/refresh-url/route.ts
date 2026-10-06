import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireSession } from "@/lib/auth";

// Bucket privé où generate-courrier archive les PDF : <organisation>/<dossier>/courriers/<document>.pdf
const BUCKET_ARCHIVE = "dossier-docs";
const DUREE_LIEN_S = 60 * 60;

type CourrierLien = {
  id: string;
  pdfmonkey_doc_id: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
};

type PdfMonkeyReponse = { document?: { download_url?: string | null } };

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { courrier_id?: string } | null;
  if (!body?.courrier_id) return err("courrier_id requis", 400);

  const session = await requireSession();
  if (isResponse(session)) return session;
  const { supabase } = session;
  const organisationId = session.profile.organisation_id;

  const { data: courrier } = await supabase
    .from("courriers")
    .select("id, pdfmonkey_doc_id, pdf_url, pdf_path")
    .eq("id", body.courrier_id)
    .eq("organisation_id", organisationId)
    .single<CourrierLien>();

  if (!courrier) return err("Courrier introuvable", 404);

  // 1. Archive de l'étude : lien signé valable une heure, créé à la demande.
  if (courrier.pdf_path) {
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET_ARCHIVE)
      .createSignedUrl(courrier.pdf_path, DUREE_LIEN_S);
    if (!signErr && signed?.signedUrl) {
      return NextResponse.json({ url: signed.signedUrl, source: "archive" });
    }
    console.error("[refresh-url] lien signé", signErr?.message);
  }

  // 2. Repli PDFMonkey : courrier antérieur à l'archivage, ou archive illisible.
  if (!courrier.pdfmonkey_doc_id) {
    return NextResponse.json({ url: courrier.pdf_url, source: "enregistree" });
  }
  const apiKey = process.env.PDFMONKEY_API_KEY;
  if (!apiKey) {
    console.error("[refresh-url] PDFMONKEY_API_KEY non configuré");
    return NextResponse.json({ url: courrier.pdf_url, source: "enregistree" });
  }

  const pollRes = await fetch(
    `https://api.pdfmonkey.io/api/v1/documents/${courrier.pdfmonkey_doc_id}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  ).catch(() => null);
  if (!pollRes || !pollRes.ok) {
    return NextResponse.json({ url: courrier.pdf_url, source: "enregistree" });
  }
  const polled = (await pollRes.json().catch(() => null)) as PdfMonkeyReponse | null;
  const fresh = polled?.document?.download_url;
  if (!fresh) return NextResponse.json({ url: courrier.pdf_url, source: "enregistree" });

  await supabase
    .from("courriers")
    .update({ pdf_url: fresh })
    .eq("id", courrier.id)
    .eq("organisation_id", organisationId);
  return NextResponse.json({ url: fresh, source: "pdfmonkey" });
}
