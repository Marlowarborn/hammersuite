-- 0003 : index d'unicité des checklists utilisables par ON CONFLICT.
-- Les index partiels de 0001 bloquaient les doublons mais ne pouvaient pas servir
-- d'arbitre à un upsert (PostgREST ne transmet pas le prédicat WHERE). Les NULL étant
-- distincts, un index complet garde exactement la même règle : une ligne par
-- (dossier, phase, libellé) et par (vente, phase, libellé).
drop index if exists public.checklist_items_dossier_item_key;
drop index if exists public.checklist_items_vente_item_key;
create unique index if not exists checklist_items_dossier_item_key
  on public.checklist_items (dossier_id, phase, label);
create unique index if not exists checklist_items_vente_item_key
  on public.checklist_items (vente_id, phase, label);
