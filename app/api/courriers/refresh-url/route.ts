import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireSession } from "@/lib/auth";

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.PDFMONKEY_API_KEY;
  if (!apiKey) return err("PDFMONKEY_API_KEY non configuré", 500);

  const body = (await req.json().catch(() => null)) as { courrier_id?: string } | null;
  if (!body?.courrier_id) return err("courrier_id requis", 400);

  const session = await requireSession();
  if (isResponse(session)) return session;
  const { supabase } = session;

  const { data: courrier } = await supabase
    .from("courriers")
    .select("id, pdfmonkey_doc_id, organisation_id, pdf_url")
    .eq("id", body.courrier_id)
    .eq("organisation_id", session.profile.organisation_id)
    .single();

  if (!courrier) return err("Courrier introuvable", 404);
  if (!courrier.pdfmonkey_doc_id) {
    return NextResponse.json({ url: courrier.pdf_url });
  }

  const pollRes = await fetch(`https://api.pdfmonkey.io/api/v1/documents/${courrier.pdfmonkey_doc_id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!pollRes.ok) {
    return NextResponse.json({ url: courrier.pdf_url });
  }
  const polled = await pollRes.json();
  const fresh = polled?.document?.download_url as string | undefined;
  if (!fresh) return NextResponse.json({ url: courrier.pdf_url });

  await supabase.from("courriers").update({ pdf_url: fresh }).eq("id", courrier.id);
  return NextResponse.json({ url: fresh });
}
