import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Garde d'authentification pour les routes API.
 * Renvoie la session (client Supabase lié aux cookies, utilisateur, profil et étude)
 * ou une réponse d'erreur prête à être renvoyée.
 */

export type SessionProfile = {
  id: string;
  organisation_id: string;
  role: string | null;
  full_name: string | null;
  email: string | null;
  qualite: string | null;
};

export type ApiSession = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: { id: string; email: string | null };
  profile: SessionProfile;
};

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export async function requireSession(): Promise<ApiSession | NextResponse> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organisation_id, role, full_name, email, qualite")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organisation_id) {
    return NextResponse.json(
      { error: "Profil sans étude rattachée" },
      { status: 403 }
    );
  }

  return {
    supabase,
    user: { id: user.id, email: user.email ?? null },
    profile: profile as SessionProfile,
  };
}

/** Limites d'upload appliquées par les routes API. */
export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;

/** Modèle Claude utilisé par les routes d'extraction, surchargeable par variable d'environnement. */
export const CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
