import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  COURRIER_TYPES,
  DESTINATAIRES,
  type CourrierType,
  type DestinataireValue,
} from "@/lib/labels";
import { buildPayload, nextFactureReference, type CourrierOptions } from "@/lib/courrier-payload";

const TEMPLATE_ENV: Record<CourrierType, string> = {
  ordonnance: "PDFMONKEY_TEMPLATE_ORDONNANCE",
  requete: "PDFMONKEY_TEMPLATE_REQUETE",
  der: "PDFMONKEY_TEMPLATE_DER",
  note_honoraires: "PDFMONKEY_TEMPLATE_NOTE_HONORAIRES",
  courrier_envoi: "PDFMONKEY_TEMPLATE_COURRIER_ENVOI",
  inventaire_judiciaire: "PDFMONKEY_TEMPLATE_INVENTAIRE_JUDICIAIRE",
};

const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;

type Body = {
  dossier_id?: string;
  vente_id?: string;
  type?: CourrierType;
  destinataire?: DestinataireValue;
  options?: CourrierOptions;
};

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.PDFMONKEY_API_KEY;
  if (!apiKey) return err("PDFMONKEY_API_KEY non configuré", 500);

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return err("Corps de requête invalide", 400);

  const { dossier_id, vente_id, type, destinataire, options } = body;

  if (!type || !(COURRIER_TYPES as readonly string[]).includes(type)) {
    return err("Type de courrier invalide", 400);
  }
  if (!dossier_id) return err("dossier_id requis", 400);

  const templateEnvKey = TEMPLATE_ENV[type];
  const templateId = process.env[templateEnvKey];
  if (!templateId) return err(`${templateEnvKey} non configuré`, 500);

  if (type === "courrier_envoi") {
    if (!destinataire || !DESTINATAIRES.some((d) => d.value === destinataire)) {
      return err("destinataire requis pour courrier_envoi", 400);
    }
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Non authentifié", 401);

  const { data: dossier, error: dossierErr } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossier_id)
    .single();
  if (dossierErr || !dossier) return err("Dossier introuvable", 404);

  const { data: organisation } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", dossier.organisation_id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, qualite")
    .eq("id", user.id)
    .single();

  let numeroFacture: string | null = null;
  if (type === "note_honoraires") {
    numeroFacture = await nextFactureReference(supabase, dossier.organisation_id);
  }

  const payload = await buildPayload(supabase, {
    dossier,
    organisation: organisation || null,
    profile: profile || null,
    type,
    destinataire: destinataire || null,
    options,
    numero_facture: numeroFacture || undefined,
  });

  const createRes = await fetch("https://api.pdfmonkey.io/api/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      document: {
        document_template_id: templateId,
        payload: JSON.stringify(payload),
        status: "pending",
      },
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return err(`PDFMonkey: ${text}`, 502);
  }

  const created = await createRes.json();
  const docId: string | undefined = created?.document?.id;
  if (!docId) return err("PDFMonkey: ID document manquant dans la réponse", 502);

  let pdfUrl: string | null = null;
  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(`https://api.pdfmonkey.io/api/v1/documents/${docId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!pollRes.ok) continue;
    const polled = await pollRes.json();
    const status = polled?.document?.status;
    if (status === "success") {
      pdfUrl = polled.document.download_url;
      break;
    }
    if (status === "failure" || status === "error") {
      return err(`PDFMonkey: génération échouée (${status})`, 502);
    }
  }

  if (!pdfUrl) return err("PDFMonkey: timeout (>60s)", 504);

  const { data: courrier, error: insertErr } = await supabase
    .from("courriers")
    .insert({
      organisation_id: dossier.organisation_id,
      dossier_id,
      vente_id: vente_id || null,
      type,
      destinataire: destinataire || null,
      reference: numeroFacture,
      pdf_url: pdfUrl,
      pdfmonkey_doc_id: docId,
      status: "generated",
      generated_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (insertErr || !courrier) {
    return err(`Sauvegarde courrier: ${insertErr?.message || "inconnue"}`, 500);
  }

  await supabase.from("activity_log").insert({
    organisation_id: dossier.organisation_id,
    user_id: user.id,
    entity_type: "courrier",
    entity_id: courrier.id,
    action: "generated",
    details: { type, destinataire: destinataire || null, reference: numeroFacture, dossier_id },
  });

  return NextResponse.json({ courrier });
}
