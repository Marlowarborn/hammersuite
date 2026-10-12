import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CLAUDE_MODEL,
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  isResponse,
  requireSession,
} from "@/lib/auth";

export const maxDuration = 60;

const PROMPT = `Tu es un expert en extraction de données pour des maisons de ventes aux enchères françaises. Analyse ce document et extrais TOUS les objets ou lots mentionnés. Pour chaque objet trouvé, retourne un objet JSON avec ces champs: titre (obligatoire), artiste, description, technique, dimensions, epoque, provenance, consignateur, estimation_basse (nombre entier), estimation_haute (nombre entier), notes. Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ou après, sans markdown, sans backticks. Si aucun objet n'est trouvé, retourne [].`;

type ImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Service d'extraction non configuré" }, { status: 503 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier transmis" }, { status: 400 });
  }

  const isPDF = file.type === "application/pdf";
  const isImage = IMAGE_MIME_TYPES.has(file.type);
  if (!isPDF && !isImage) {
    return NextResponse.json({ error: "Format non pris en charge (PDF, JPG, PNG, WebP)" }, { status: 415 });
  }
  const maxBytes = isPDF ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `Fichier trop lourd (${Math.round(maxBytes / 1024 / 1024)} Mo maximum)` },
      { status: 413 }
    );
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const source: Anthropic.ContentBlockParam = isPDF
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image", source: { type: "base64", media_type: file.type as ImageMime, data: base64 } };

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: [source, { type: "text", text: PROMPT }] }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    let objets: unknown;
    try {
      objets = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json({ error: "Impossible d'extraire les données de ce document" }, { status: 422 });
    }
    if (!Array.isArray(objets)) {
      return NextResponse.json({ error: "Réponse d'extraction inattendue" }, { status: 422 });
    }
    return NextResponse.json({ objets, count: objets.length, genere_par_ia: true });
  } catch (err) {
    console.error("[extract-document]", session.profile.organisation_id, err);
    return NextResponse.json({ error: "Extraction indisponible pour le moment" }, { status: 502 });
  }
}
