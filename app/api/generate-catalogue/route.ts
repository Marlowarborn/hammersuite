import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sale, lots } = body;

    const payload = {
      document_template_id: process.env.PDFMONKEY_TEMPLATE_ID,
      payload: JSON.stringify({
        sale_name: sale.name,
        date: new Date(sale.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
        location: sale.location,
        category: sale.category,
        house_name: "Maison Durand & Associés",
        lots: lots.map((lot: any) => ({
          number: lot.number,
          title: lot.title,
          artist: lot.artist || "",
          description: lot.description || "",
          dimensions: lot.dimensions || "",
          provenance: lot.provenance || "",
          medium: lot.medium || "",
          period: lot.period || "",
          estimate_low: lot.estLow?.toLocaleString("fr-FR") || "—",
          estimate_high: lot.estHigh?.toLocaleString("fr-FR") || "—",
          image_url: lot.image_url || "",
        })),
      }),
      status: "pending",
    };

    const response = await fetch("https://api.pdfmonkey.io/api/v1/documents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PDFMONKEY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ document: payload }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    const documentId = data.document.id;

    // Poll until ready (max 30 seconds)
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      
      const statusRes = await fetch(`https://api.pdfmonkey.io/api/v1/documents/${documentId}`, {
        headers: { "Authorization": `Bearer ${process.env.PDFMONKEY_API_KEY}` },
      });
      
      const statusData = await statusRes.json();
      const status = statusData.document.status;

      if (status === "success") {
        return NextResponse.json({ 
          url: statusData.document.download_url,
          id: documentId 
        });
      }

      if (status === "error") {
        return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Timeout — PDF took too long" }, { status: 500 });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
