import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Callback d'authentification Supabase (magic link, invitation, réinitialisation).
 * La destination `next` est bornée au site : un chemin absolu interne uniquement,
 * jamais une URL externe ni un chemin de type `//hote` ou `/@hote`.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/dashboard";
  }
  if (raw.includes("@") || raw.includes("\n") || raw.includes("\r")) {
    return "/dashboard";
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=lien_invalide`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=lien_expire`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
