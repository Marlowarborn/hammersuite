import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    if (!file) return NextResponse.json({ error: "No photo provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
          { type: "text", text: `Tu es un expert en objets d'art et antiquités pour une maison de ventes aux enchères française. Analyse cette photo et identifie l'objet. Retourne UNIQUEMENT un JSON valide sans markdown avec ces champs: {"titre": "désignation précise", "technique": "matière ou technique", "epoque": "époque estimée", "description": "description courte professionnelle en 1-2 phrases", "categorie": "catégorie", "confidence": "high/medium/low"}` }
        ]
      }]
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      return NextResponse.json(JSON.parse(clean));
    } catch {
      return NextResponse.json({ error: "Analyse impossible", raw: text }, { status: 422 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
