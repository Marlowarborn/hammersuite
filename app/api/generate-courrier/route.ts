import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireSession, type ApiSession } from "@/lib/auth";
import {
  COURRIER_TYPES,
  DESTINATAIRES,
  type CourrierType,
  type DestinataireValue,
} from "@/lib/labels";
import { buildPayload, type CourrierOptions } from "@/lib/courrier-payload";

const TEMPLATE_ENV: Record<CourrierType, string> = {
  ordonnance: "PDFMONKEY_TEMPLATE_ORDONNANCE",
  requete: "PDFMONKEY_TEMPLATE_REQUETE",
  der: "PDFMONKEY_TEMPLATE_DER",
  note_honoraires: "PDFMONKEY_TEMPLATE_NOTE_HONORAIRES",
  courrier_envoi: "PDFMONKEY_TEMPLATE_COURRIER_ENVOI",
  inventaire_judiciaire: "PDFMONKEY_TEMPLATE_INVENTAIRE_JUDICIAIRE",
};

export const maxDuration = 60;

// Fin du polling, mesurée depuis le début de la requête : laisse une dizaine de secondes
// sous maxDuration pour archiver le PDF et enregistrer la ligne.
const FIN_POLLING_MS = 48_000;
const POLL_INTERVAL_MS = 2_000;

// Bucket privé des pièces de dossier : <organisation>/<dossier>/courriers/<document PDFMonkey>.pdf
const BUCKET_ARCHIVE = "dossier-docs";

type Supabase = ApiSession["supabase"];

type Body = {
  dossier_id?: string;
  vente_id?: string;
  type?: CourrierType;
  destinataire?: DestinataireValue;
  options?: CourrierOptions;
};

type PdfMonkeyReponse = {
  document?: {
    id?: string;
    status?: string;
    download_url?: string | null;
    failure_cause?: string | null;
  };
};

// Note d'honoraires en attente : numéro réservé, PDF pas encore généré.
type Brouillon = { id: string; reference: string };

type CourrierRow = Record<string, unknown> & { id: string };

function err(message: string, status: number, extra?: Record<string, string>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Réserve le numéro d'une note d'honoraires AVANT l'appel à PDFMonkey.
 * Un brouillon numéroté du même dossier est réutilisé tel quel ; sinon un numéro est
 * consommé (next_facture_reference, atomique, jamais rendu) et inscrit aussitôt sur une
 * ligne "draft". Un échec de génération laisse ce brouillon : la numérotation reste sans trou.
 */
async function obtenirBrouillon(
  supabase: Supabase,
  ctx: {
    organisationId: string;
    dossierId: string;
    venteId: string | null;
    destinataire: DestinataireValue | null;
    userId: string;
  },
): Promise<Brouillon | NextResponse> {
  const { data: existant, error: existantErr } = await supabase
    .from("courriers")
    .select("id, reference")
    .eq("organisation_id", ctx.organisationId)
    .eq("dossier_id", ctx.dossierId)
    .eq("type", "note_honoraires")
    .eq("status", "draft")
    .not("reference", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Brouillon>();
  if (existantErr) {
    console.error("[generate-courrier] lecture brouillon", existantErr.message);
    return err("Lecture des notes d'honoraires impossible", 500);
  }
  if (existant) return existant;

  const { data: reference, error: rpcErr } = await supabase.rpc("next_facture_reference", {
    org: ctx.organisationId,
  });
  if (rpcErr || typeof reference !== "string" || reference.length === 0) {
    console.error("[generate-courrier] numérotation", rpcErr?.message);
    return err("Numérotation de la note d'honoraires impossible", 500);
  }

  const { data: cree, error: creeErr } = await supabase
    .from("courriers")
    .insert({
      organisation_id: ctx.organisationId,
      dossier_id: ctx.dossierId,
      vente_id: ctx.venteId,
      type: "note_honoraires",
      destinataire: ctx.destinataire,
      reference,
      status: "draft",
      created_by: ctx.userId,
    })
    .select("id, reference")
    .single<Brouillon>();
  if (creeErr || !cree) {
    // Numéro consommé sans ligne pour le porter : seul cas de trou, à consigner à la main.
    console.error("[generate-courrier] brouillon non enregistré, numéro perdu", reference, creeErr?.message);
    return err("Note d'honoraires non enregistrée, réessayez", 500);
  }
  return cree;
}

/** Copie le PDF PDFMonkey dans le bucket privé de l'étude. Renvoie le chemin, ou null en cas d'échec. */
async function archiverPdf(supabase: Supabase, url: string, chemin: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[generate-courrier] téléchargement du PDF", res.status);
      return null;
    }
    const octets = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage
      .from(BUCKET_ARCHIVE)
      .upload(chemin, octets, { contentType: "application/pdf", upsert: false });
    if (error) {
      console.error("[generate-courrier] archivage", error.message);
      return null;
    }
    return chemin;
  } catch (e) {
    console.error("[generate-courrier] archivage", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const debut = Date.now();
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

  const session = await requireSession();
  if (isResponse(session)) return session;
  const { supabase, user } = session;
  const organisationId = session.profile.organisation_id;

  const { data: dossier, error: dossierErr } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossier_id)
    .eq("organisation_id", organisationId)
    .single();
  if (dossierErr || !dossier) return err("Dossier introuvable", 404);

  // Vente vérifiée avant toute réservation de numéro : une clé étrangère refusée après coup
  // consommerait un numéro de facture pour rien.
  if (vente_id) {
    const { data: vente } = await supabase
      .from("ventes")
      .select("id")
      .eq("id", vente_id)
      .eq("organisation_id", organisationId)
      .maybeSingle();
    if (!vente) return err("Vente introuvable", 404);
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", organisationId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, qualite")
    .eq("id", user.id)
    .single();

  const brouillon =
    type === "note_honoraires"
      ? await obtenirBrouillon(supabase, {
          organisationId,
          dossierId: dossier_id,
          venteId: vente_id || null,
          destinataire: destinataire || null,
          userId: user.id,
        })
      : null;
  if (isResponse(brouillon)) return brouillon;
  const numeroFacture = brouillon?.reference ?? null;

  // Erreur renvoyée au client ; signale le brouillon conservé quand un numéro est réservé.
  const echec = (message: string, status: number) =>
    brouillon
      ? err(`${message} (brouillon conservé, numéro ${brouillon.reference} réservé)`, status, {
          courrier_id: brouillon.id,
          reference: brouillon.reference,
        })
      : err(message, status);

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
  }).catch((e: unknown) => {
    console.error("[generate-courrier] PDFMonkey injoignable", e);
    return null;
  });

  if (!createRes || !createRes.ok) {
    // Détail de PDFMonkey en journal serveur uniquement, jamais dans la réponse.
    if (createRes) console.error("[generate-courrier] PDFMonkey", createRes.status, await createRes.text());
    return echec("Génération du courrier refusée par le service PDF", 502);
  }

  const created = (await createRes.json().catch(() => null)) as PdfMonkeyReponse | null;
  const docId = created?.document?.id;
  if (!docId) {
    console.error("[generate-courrier] PDFMonkey : identifiant de document absent");
    return echec("Réponse inattendue du service PDF", 502);
  }

  let pdfUrl: string | null = null;
  while (Date.now() - debut < FIN_POLLING_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(`https://api.pdfmonkey.io/api/v1/documents/${docId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch(() => null);
    if (!pollRes || !pollRes.ok) continue;
    const polled = (await pollRes.json().catch(() => null)) as PdfMonkeyReponse | null;
    const doc = polled?.document;
    if (doc?.status === "success" && doc.download_url) {
      pdfUrl = doc.download_url;
      break;
    }
    if (doc?.status === "failure" || doc?.status === "error") {
      console.error("[generate-courrier] échec PDFMonkey", docId, doc.failure_cause);
      return echec("Génération du courrier échouée (modèle PDF à vérifier)", 502);
    }
  }

  if (!pdfUrl) return echec("Génération du courrier trop longue, réessayez", 504);

  // Archivage : l'URL PDFMonkey expire, le fichier archivé fait foi (notes d'honoraires comprises).
  // Un archivage manqué n'empêche pas l'enregistrement : refresh-url se replie alors sur PDFMonkey.
  const pdfPath = await archiverPdf(
    supabase,
    pdfUrl,
    `${organisationId}/${dossier_id}/courriers/${docId}.pdf`,
  );

  const generation = {
    pdf_url: pdfUrl,
    pdf_path: pdfPath,
    pdfmonkey_doc_id: docId,
    status: "generated",
    generated_at: new Date().toISOString(),
  };

  // Note d'honoraires : le brouillon passe à "generated" (filtre status pour qu'un même numéro
  // ne soit pas généré deux fois en parallèle). Autres types : une ligne créée après génération.
  const { data: courrier, error: enregistrementErr } = brouillon
    ? await supabase
        .from("courriers")
        .update(generation)
        .eq("id", brouillon.id)
        .eq("organisation_id", organisationId)
        .eq("status", "draft")
        .select()
        .single<CourrierRow>()
    : await supabase
        .from("courriers")
        .insert({
          organisation_id: organisationId,
          dossier_id,
          vente_id: vente_id || null,
          type,
          destinataire: destinataire || null,
          reference: null,
          ...generation,
          created_by: user.id,
        })
        .select()
        .single<CourrierRow>();

  if (enregistrementErr || !courrier) {
    console.error("[generate-courrier] enregistrement", enregistrementErr?.message, docId, pdfPath);
    return echec("Courrier généré mais non enregistré", 500);
  }

  await supabase.from("activity_log").insert({
    organisation_id: organisationId,
    user_id: user.id,
    entity_type: "courrier",
    entity_id: courrier.id,
    action: "generated",
    details: { type, destinataire: destinataire || null, reference: numeroFacture, dossier_id },
  });

  return NextResponse.json({ courrier });
}
