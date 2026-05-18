-- Étape 7 — Courriers / PDFMonkey
-- À exécuter manuellement dans le SQL Editor Supabase.

-- 1) Champs étude (organisations) — utilisés dans tous les courriers
alter table organisations add column if not exists adresse text;
alter table organisations add column if not exists code_postal text;
alter table organisations add column if not exists ville text;
alter table organisations add column if not exists telephone text;
alter table organisations add column if not exists email text;
alter table organisations add column if not exists siret text;
alter table organisations add column if not exists iban text;

-- 2) Qualité sur le profil — affichée dans le bloc signataire des courriers
alter table profiles add column if not exists qualite text;

-- 3) Référence sur les courriers — utilisée pour le numéro de facture des notes d'honoraires
--    Format attendu : "NH-{année}-{compteur 3 chiffres}" (ex. NH-2026-001).
alter table courriers add column if not exists reference text;

-- Index dédié au SELECT MAX par organisation/type/année lors du calcul du prochain numéro.
create index if not exists idx_courriers_reference_lookup
  on courriers (organisation_id, type, reference);
