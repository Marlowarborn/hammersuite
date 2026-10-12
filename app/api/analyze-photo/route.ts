import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CLAUDE_MODEL,
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  isResponse,
  requireSession,
} from "@/lib/auth";

export const maxDuration = 30;

const PROMPT = `Tu es un expert en objets d'art et antiquités pour une maison de ventes aux enchères française. Analyse cette photo et identifie l'objet. Retourne UNIQUEMENT un JSON valide sans markdown avec ces champs: {"titre": "désignation précise", "technique": "matière ou technique", "epoque": "époque estimée", "description": "description courte professionnelle en 1-2 phrases", "categorie": "catégorie", "confidence": "high/medium/low"}`;

type ImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isResponse(session)) return session;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Service d'analyse non configuré" }, { status: 503 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucune photo transmise" }, { status: 400 });
  }
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Format non pris en charge (JPG, PNG, WebP, GIF)" }, { status: 415 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Photo trop lourde (8 Mo maximum)" }, { status: 413 });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: file.type as ImageMime, data: base64 } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      return NextResponse.json({ ...JSON.parse(clean), genere_par_ia: true });
    } catch {
      return NextResponse.json({ error: "Analyse impossible sur cette photo" }, { status: 422 });
    }
  } catch (err) {
    console.error("[analyze-photo]", session.profile.organisation_id, err);
    return NextResponse.json({ error: "Analyse indisponible pour le moment" }, { status: 502 });
  }
}
