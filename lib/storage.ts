import type { SupabaseClient } from "@supabase/supabase-js";

// Buckets privés (supabase/migrations/0002_rls.sql) : chaque fichier est rangé sous
// `<organisation_id>/...` et ne se lit que par une URL signée de courte durée.
// La base stocke le CHEMIN du fichier, jamais une URL qui expire.
export type StorageBucket = "dossier-docs" | "vehicule-docs" | "objet-photos";

// Durée par défaut d'une URL signée : 1 h.
const DUREE_PAR_DEFAUT = 60 * 60;

// Anciens enregistrements : la colonne contient déjà une URL complète (signée 1 an ou publique).
const estUneUrl = (valeur: string) => /^https?:\/\//i.test(valeur);

// Signe un chemin de stockage. Renvoie null si le chemin est vide ou si la signature échoue.
// Utilisable côté client (createClient) comme côté serveur (createServerSupabaseClient).
export async function signedUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  path: string | null | undefined,
  seconds: number = DUREE_PAR_DEFAUT,
): Promise<string | null> {
  if (!path) return null;
  if (estUneUrl(path)) return path;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error || !data) return null;
  return data.signedUrl;
}

// Signe plusieurs chemins en un seul appel. Renvoie une table chemin → URL signée ;
// les chemins vides sont ignorés, les URL complètes (anciens enregistrements) renvoyées telles
// quelles, et un chemin dont la signature échoue est simplement absent du résultat.
export async function signedUrls(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  paths: readonly (string | null | undefined)[],
  seconds: number = DUREE_PAR_DEFAUT,
): Promise<Record<string, string>> {
  const resultat: Record<string, string> = {};
  const aSigner = new Set<string>();
  for (const path of paths) {
    if (!path) continue;
    if (estUneUrl(path)) resultat[path] = path;
    else aSigner.add(path);
  }
  if (aSigner.size === 0) return resultat;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(Array.from(aSigner), seconds);
  if (error || !data) return resultat;
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) resultat[item.path] = item.signedUrl;
  }
  return resultat;
}
