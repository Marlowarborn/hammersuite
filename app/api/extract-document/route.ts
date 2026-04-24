import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;
    const isImage = mimeType.startsWith("image/");
    const isPDF = mimeType === "application/pdf";

    if (!isImage && !isPDF) {
      return NextResponse.json({ error: "Format non supporte. Utilisez PDF, JPG ou PNG." }, { status: 400 });
    }

    const prompt = `Tu es un expert en extraction de donnees pour des maisons de ventes aux encheres francaises. Analyse ce document et extrait TOUS les objets/lots mentionnes. Pour chaque objet trouve, retourne un objet JSON avec ces champs: titre (obligatoire), artiste, description, technique, dimensions, epoque, provenance, consignateur, estimation_basse (nombre entier), estimation_haute (nombre entier), notes. Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ou apres, sans markdown, sans backticks. Si aucun objet n'est trouve, retourne [].`;

    let messages: Anthropic.MessageParam[];

    if (isPDF) {
      messages = [{
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          } as any,
          { type: "text", text: prompt },
        ],
      }];
    } else {
      const imageMediaType = mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      messages = [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType,
              data: base64,
            },
          },
          { type: "text", text: prompt },
        ],
      }];
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let objets = [];
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      objets = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "Impossible d'extraire les donnees", raw: text }, { status: 422 });
    }

    return NextResponse.json({ objets, count: objets.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
