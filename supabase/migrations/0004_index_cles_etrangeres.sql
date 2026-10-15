-- 0004 : index couvrant les clés étrangères (advisor Supabase « unindexed_foreign_keys », 15/10/2026).
--
-- Colonnes « qui » (utilisateur) sans aucun index : ajoutés, ils servent aux on delete set null.
-- Clés composites (x, organisation_id) dont l'index existant n'était que sur x : remplacés par un
-- index (x, organisation_id), même colonne de tête, donc les requêtes existantes l'utilisent.
-- Volontairement laissés tels quels : checklist_items (dossier_id, ordre) et (vente_id, ordre),
-- courriers (dossier_id, generated_at), dossier_contrats et dossier_lieux (dossier_id, created_at) :
-- leur colonne de tri sert l'affichage et la colonne de tête suffit aux suppressions en cascade.
-- L'advisor continuera de les signaler en « info » ; c'est accepté.

create index if not exists activity_log_user_id_idx on public.activity_log (user_id);
create index if not exists checklist_items_completed_by_idx on public.checklist_items (completed_by);
create index if not exists courriers_created_by_idx on public.courriers (created_by);
create index if not exists invitations_invited_by_idx on public.invitations (invited_by);

drop index if exists public.objets_dossier_id_idx;
create index if not exists objets_dossier_org_idx on public.objets (dossier_id, organisation_id);
drop index if exists public.objets_vente_id_idx;
create index if not exists objets_vente_org_idx on public.objets (vente_id, organisation_id);
drop index if exists public.courriers_vente_id_idx;
create index if not exists courriers_vente_org_idx on public.courriers (vente_id, organisation_id);
drop index if exists public.vehicule_docs_objet_id_idx;
create index if not exists vehicule_docs_objet_org_idx on public.vehicule_docs (objet_id, organisation_id);
