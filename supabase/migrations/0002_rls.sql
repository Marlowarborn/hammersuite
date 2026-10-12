-- =============================================================================
-- 0002_rls.sql : isolation par organisation (RLS), droits, inscription, storage
-- -----------------------------------------------------------------------------
-- Suppose 0001_schema.sql appliqué. Principe : chaque ligne métier porte
-- organisation_id ; un utilisateur authentifié ne voit et ne modifie que les
-- lignes de l'organisation de son profil. Les clés étrangères composites de
-- 0001 empêchent en plus de rattacher une ligne à un parent d'une autre
-- organisation. Le rôle anon n'a aucun accès aux tables métier.
-- Idempotent : create or replace, drop policy if exists, drop trigger if exists.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Fonctions d'appartenance
-- -----------------------------------------------------------------------------

-- Organisation de l'utilisateur courant (null si non connecté ou sans profil).
-- security definer : lit profiles sans repasser par sa RLS (sinon récursion).
create or replace function public.auth_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.organisation_id
  from public.profiles p
  where p.id = auth.uid()
$$;

-- AJOUT : vrai si l'utilisateur courant est admin de son organisation (utilisé par les politiques organisations et invitations).
create or replace function public.auth_est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  )
$$;

revoke all on function public.auth_organisation_id() from public, anon;
revoke all on function public.auth_est_admin() from public, anon;
grant execute on function public.auth_organisation_id() to authenticated, service_role;
grant execute on function public.auth_est_admin() to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 2. Activation de la RLS sur toutes les tables
-- -----------------------------------------------------------------------------

alter table public.organisations    enable row level security;
alter table public.profiles         enable row level security;
alter table public.invitations      enable row level security;
alter table public.ventes           enable row level security;
alter table public.dossiers         enable row level security;
alter table public.objets           enable row level security;
alter table public.vehicule_docs    enable row level security;
alter table public.dossier_lieux    enable row level security;
alter table public.dossier_contrats enable row level security;
alter table public.checklist_items  enable row level security;
alter table public.courriers        enable row level security;
alter table public.activity_log     enable row level security;
alter table public.compteurs        enable row level security;  -- aucune politique : accès par fonctions uniquement


-- -----------------------------------------------------------------------------
-- 3. Droits de table (en plus de la RLS, défense en profondeur)
-- Supabase accorde par défaut tous les droits à anon et authenticated sur le
-- schéma public : on les restreint à ce que le code utilise réellement.
-- -----------------------------------------------------------------------------

revoke all on public.organisations, public.profiles, public.invitations, public.ventes,
              public.dossiers, public.objets, public.vehicule_docs, public.dossier_lieux,
              public.dossier_contrats, public.checklist_items, public.courriers,
              public.activity_log, public.compteurs
  from anon;

-- compteurs : jamais accessible directement.
revoke all on public.compteurs from authenticated;

-- organisations : lecture, et mise à jour des seules coordonnées de l'étude.
-- Création par le trigger handle_new_user, jamais par le client.
revoke insert, update, delete, truncate on public.organisations from authenticated;
grant select on public.organisations to authenticated;
grant update (name, adresse, code_postal, ville, telephone, email, siret, iban, numero_tva_intracom)
  on public.organisations to authenticated;

-- profiles : lecture, et mise à jour de full_name et qualite uniquement.
-- organisation_id, role, email et id ne sont pas modifiables par le client.
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, qualite) on public.profiles to authenticated;

-- invitations : lecture, création, révocation (pas de modification).
revoke update, truncate on public.invitations from authenticated;
grant select, insert, delete on public.invitations to authenticated;

-- activity_log : journal en ajout seul.
revoke update, delete, truncate on public.activity_log from authenticated;
grant select, insert on public.activity_log to authenticated;

-- Tables métier : CRUD complet, filtré par la RLS.
revoke truncate on public.ventes, public.dossiers, public.objets, public.vehicule_docs,
                   public.dossier_lieux, public.dossier_contrats, public.checklist_items,
                   public.courriers
  from authenticated;
grant select, insert, update, delete on public.ventes, public.dossiers, public.objets,
                                       public.vehicule_docs, public.dossier_lieux,
                                       public.dossier_contrats, public.checklist_items,
                                       public.courriers
  to authenticated;


-- -----------------------------------------------------------------------------
-- 4. organisations
-- -----------------------------------------------------------------------------

drop policy if exists "organisations_select_membres" on public.organisations;
drop policy if exists "organisations_update_admin" on public.organisations;

-- Lecture : un utilisateur ne voit que sa propre organisation.
create policy "organisations_select_membres" on public.organisations
  for select to authenticated
  using (id = (select public.auth_organisation_id()));

-- Mise à jour : réservée aux admins de l'organisation (colonnes limitées par le grant ci-dessus).
create policy "organisations_update_admin" on public.organisations
  for update to authenticated
  using (id = (select public.auth_organisation_id()) and (select public.auth_est_admin()))
  with check (id = (select public.auth_organisation_id()) and (select public.auth_est_admin()));

-- Pas de politique insert ni delete : création par handle_new_user, suppression par service_role.


-- -----------------------------------------------------------------------------
-- 5. profiles
-- -----------------------------------------------------------------------------

drop policy if exists "profiles_select_meme_org" on public.profiles;
drop policy if exists "profiles_update_soi" on public.profiles;

-- Lecture : les profils de sa propre organisation (liste des membres dans les paramètres).
create policy "profiles_select_meme_org" on public.profiles
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));

-- Mise à jour : uniquement son propre profil.
create policy "profiles_update_soi" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Pas de politique insert ni delete : le profil naît avec le compte (handle_new_user)
-- et disparaît avec lui (on delete cascade sur auth.users).

-- Garde : même si un grant venait à être élargi, un client connecté ne peut pas
-- changer son organisation, son rôle ni son identifiant. Les fonctions security
-- definer (exécutées en tant que propriétaire) restent libres de le faire.
create or replace function public.profiles_garde_champs_proteges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.organisation_id is distinct from old.organisation_id
          or new.role is distinct from old.role
          or new.id is distinct from old.id) then
    raise exception 'Modification interdite : organisation_id, role et id ne sont pas modifiables par l''utilisateur'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_garde_champs_proteges on public.profiles;
create trigger profiles_garde_champs_proteges
  before update on public.profiles
  for each row execute function public.profiles_garde_champs_proteges();


-- -----------------------------------------------------------------------------
-- 6. invitations
-- -----------------------------------------------------------------------------

drop policy if exists "invitations_select_admin" on public.invitations;
drop policy if exists "invitations_insert_admin" on public.invitations;
drop policy if exists "invitations_delete_admin" on public.invitations;

-- Lecture : les admins voient les invitations de leur organisation.
create policy "invitations_select_admin" on public.invitations
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()) and (select public.auth_est_admin()));

-- Création : un admin invite dans sa propre organisation, en son nom.
create policy "invitations_insert_admin" on public.invitations
  for insert to authenticated
  with check (
    organisation_id = (select public.auth_organisation_id())
    and (select public.auth_est_admin())
    and invited_by = (select auth.uid())
  );

-- Suppression (révocation) : un admin, dans sa propre organisation.
create policy "invitations_delete_admin" on public.invitations
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()) and (select public.auth_est_admin()));


-- -----------------------------------------------------------------------------
-- 7. Tables métier : même organisation pour select, insert, update, delete
-- -----------------------------------------------------------------------------

-- ventes
drop policy if exists "ventes_select_meme_org" on public.ventes;
drop policy if exists "ventes_insert_meme_org" on public.ventes;
drop policy if exists "ventes_update_meme_org" on public.ventes;
drop policy if exists "ventes_delete_meme_org" on public.ventes;
-- Lecture : seulement les ventes de l'organisation de l'utilisateur.
create policy "ventes_select_meme_org" on public.ventes
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "ventes_insert_meme_org" on public.ventes
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "ventes_update_meme_org" on public.ventes
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation uniquement.
create policy "ventes_delete_meme_org" on public.ventes
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()));

-- dossiers
drop policy if exists "dossiers_select_meme_org" on public.dossiers;
drop policy if exists "dossiers_insert_meme_org" on public.dossiers;
drop policy if exists "dossiers_update_meme_org" on public.dossiers;
drop policy if exists "dossiers_delete_meme_org" on public.dossiers;
-- Lecture : seulement les dossiers de l'organisation de l'utilisateur.
create policy "dossiers_select_meme_org" on public.dossiers
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "dossiers_insert_meme_org" on public.dossiers
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "dossiers_update_meme_org" on public.dossiers
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation uniquement.
create policy "dossiers_delete_meme_org" on public.dossiers
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()));

-- objets
drop policy if exists "objets_select_meme_org" on public.objets;
drop policy if exists "objets_insert_meme_org" on public.objets;
drop policy if exists "objets_update_meme_org" on public.objets;
drop policy if exists "objets_delete_meme_org" on public.objets;
-- Lecture : seulement les objets de l'organisation de l'utilisateur.
create policy "objets_select_meme_org" on public.objets
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "objets_insert_meme_org" on public.objets
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "objets_update_meme_org" on public.objets
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation uniquement.
create policy "objets_delete_meme_org" on public.objets
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()));

-- vehicule_docs
drop policy if exists "vehicule_docs_select_meme_org" on public.vehicule_docs;
drop policy if exists "vehicule_docs_insert_meme_org" on public.vehicule_docs;
drop policy if exists "vehicule_docs_update_meme_org" on public.vehicule_docs;
drop policy if exists "vehicule_docs_delete_meme_org" on public.vehicule_docs;
-- Lecture : seulement les pièces véhicule de l'organisation de l'utilisateur.
create policy "vehicule_docs_select_meme_org" on public.vehicule_docs
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "vehicule_docs_insert_meme_org" on public.vehicule_docs
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "vehicule_docs_update_meme_org" on public.vehicule_docs
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation uniquement.
create policy "vehicule_docs_delete_meme_org" on public.vehicule_docs
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()));

-- dossier_lieux
drop policy if exists "dossier_lieux_select_meme_org" on public.dossier_lieux;
drop policy if exists "dossier_lieux_insert_meme_org" on public.dossier_lieux;
drop policy if exists "dossier_lieux_update_meme_org" on public.dossier_lieux;
drop policy if exists "dossier_lieux_delete_meme_org" on public.dossier_lieux;
-- Lecture : seulement les lieux de stockage de l'organisation de l'utilisateur.
create policy "dossier_lieux_select_meme_org" on public.dossier_lieux
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "dossier_lieux_insert_meme_org" on public.dossier_lieux
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "dossier_lieux_update_meme_org" on public.dossier_lieux
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation uniquement.
create policy "dossier_lieux_delete_meme_org" on public.dossier_lieux
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()));

-- dossier_contrats
drop policy if exists "dossier_contrats_select_meme_org" on public.dossier_contrats;
drop policy if exists "dossier_contrats_insert_meme_org" on public.dossier_contrats;
drop policy if exists "dossier_contrats_update_meme_org" on public.dossier_contrats;
drop policy if exists "dossier_contrats_delete_meme_org" on public.dossier_contrats;
-- Lecture : seulement les contrats annexes de l'organisation de l'utilisateur.
create policy "dossier_contrats_select_meme_org" on public.dossier_contrats
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "dossier_contrats_insert_meme_org" on public.dossier_contrats
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "dossier_contrats_update_meme_org" on public.dossier_contrats
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation uniquement.
create policy "dossier_contrats_delete_meme_org" on public.dossier_contrats
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()));

-- checklist_items
drop policy if exists "checklist_items_select_meme_org" on public.checklist_items;
drop policy if exists "checklist_items_insert_meme_org" on public.checklist_items;
drop policy if exists "checklist_items_update_meme_org" on public.checklist_items;
drop policy if exists "checklist_items_delete_meme_org" on public.checklist_items;
-- Lecture : seulement les items de checklist de l'organisation de l'utilisateur.
create policy "checklist_items_select_meme_org" on public.checklist_items
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "checklist_items_insert_meme_org" on public.checklist_items
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "checklist_items_update_meme_org" on public.checklist_items
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation uniquement.
create policy "checklist_items_delete_meme_org" on public.checklist_items
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- courriers (suppression restreinte : une note d'honoraires numérotée ne se supprime pas)
drop policy if exists "courriers_select_meme_org" on public.courriers;
drop policy if exists "courriers_insert_meme_org" on public.courriers;
drop policy if exists "courriers_update_meme_org" on public.courriers;
drop policy if exists "courriers_delete_meme_org" on public.courriers;
-- Lecture : seulement les courriers de l'organisation de l'utilisateur.
create policy "courriers_select_meme_org" on public.courriers
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : la nouvelle ligne doit porter l'organisation de l'utilisateur.
create policy "courriers_insert_meme_org" on public.courriers
  for insert to authenticated
  with check (organisation_id = (select public.auth_organisation_id()));
-- Modification : lignes de son organisation, qui ne peuvent pas en sortir.
create policy "courriers_update_meme_org" on public.courriers
  for update to authenticated
  using (organisation_id = (select public.auth_organisation_id()))
  with check (organisation_id = (select public.auth_organisation_id()));
-- Suppression : lignes de son organisation sans référence de facture (une facture émise se conserve).
create policy "courriers_delete_meme_org" on public.courriers
  for delete to authenticated
  using (organisation_id = (select public.auth_organisation_id()) and reference is null);

-- activity_log (ajout seul)
drop policy if exists "activity_log_select_meme_org" on public.activity_log;
drop policy if exists "activity_log_insert_meme_org" on public.activity_log;
-- Lecture : le journal de son organisation.
create policy "activity_log_select_meme_org" on public.activity_log
  for select to authenticated
  using (organisation_id = (select public.auth_organisation_id()));
-- Création : dans son organisation, en son propre nom.
create policy "activity_log_insert_meme_org" on public.activity_log
  for insert to authenticated
  with check (
    organisation_id = (select public.auth_organisation_id())
    and user_id = (select auth.uid())
  );
-- Pas de politique update ni delete : un journal d'activité ne se réécrit pas.


-- -----------------------------------------------------------------------------
-- 8. Inscription : création du profil (et de l'organisation) à la création du compte
-- -----------------------------------------------------------------------------

-- AJOUT : transforme un nom d'étude en slug (même logique que app/signup, accents retirés).
create or replace function public.slugifier(p_texte text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    btrim(
      regexp_replace(
        lower(translate(
          coalesce(p_texte, ''),
          'àáâãäåçèéêëìíîïñòóôõöùúûüýÿœæÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸŒÆ',
          'aaaaaaceeeeiiiinooooouuuuyyoaaaaaaaceeeeiiiinooooouuuuyyoa'
        )),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-'
    ),
    ''
  )
$$;

-- Déclenché après chaque création dans auth.users (signUp, signInWithOtp avec
-- shouldCreateUser, invitation par le dashboard Supabase).
--   a) Les métadonnées portent un indice d'invitation (invitation_org_id, ou
--      organisation_id tel que l'envoie aujourd'hui app/dashboard/settings) ET une
--      invitation ouverte, non expirée, existe en base pour cet email dans cette
--      organisation : profil rattaché avec le rôle de l'invitation, invitation
--      marquée acceptée.
--   b) Sinon : nouvelle organisation (nom tiré de organisation_name si présent)
--      et profil admin. Jamais de rattachement sur la seule foi des métadonnées.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email       text  := nullif(lower(btrim(coalesce(new.email, ''))), '');
  v_full_name   text  := nullif(btrim(v_meta ->> 'full_name'), '');
  v_indice      text  := nullif(btrim(coalesce(v_meta ->> 'invitation_org_id', v_meta ->> 'organisation_id')), '');
  v_org_indice  uuid;
  v_invitation  public.invitations%rowtype;
  v_org_id      uuid;
  v_org_nom     text;
  v_slug        text;
begin
  -- a) Invitation : l'indice doit être un uuid ET correspondre à une invitation réelle.
  if v_indice ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_org_indice := v_indice::uuid;
  end if;

  if v_org_indice is not null and v_email is not null then
    select i.* into v_invitation
    from public.invitations i
    where i.organisation_id = v_org_indice
      and i.email = v_email
      and i.accepted_at is null
      and i.expires_at > now()
    order by i.created_at desc
    limit 1
    for update;
  end if;

  if v_invitation.id is not null then
    insert into public.profiles (id, organisation_id, full_name, email, role)
    values (new.id, v_invitation.organisation_id, v_full_name, v_email, v_invitation.role);

    update public.invitations
    set accepted_at = now()
    where id = v_invitation.id;

    return new;
  end if;

  -- b) Pas d'invitation valide : nouvelle organisation dont l'utilisateur est admin.
  v_org_nom := coalesce(
    nullif(btrim(v_meta ->> 'organisation_name'), ''),
    'Étude de ' || coalesce(v_full_name, split_part(v_email, '@', 1), 'nouvel utilisateur')
  );
  v_slug := public.slugifier(v_org_nom);
  if v_slug is null or exists (select 1 from public.organisations o where o.slug = v_slug) then
    v_slug := coalesce(v_slug || '-', '') || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  insert into public.organisations (name, slug)
  values (v_org_nom, v_slug)
  returning id into v_org_id;

  insert into public.profiles (id, organisation_id, full_name, email, role)
  values (new.id, v_org_id, v_full_name, v_email, 'admin');

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.profiles_garde_champs_proteges() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 9. Storage : 3 buckets privés, rangés par organisation
-- Convention de chemin (déjà suivie par le code) : "<organisation_id>/..."
--   dossier-docs  : <org>/<dossier>/declaration_honneur.<ext>
--                   <org>/<dossier>/contrats/<contrat>.<ext>
--                   <org>/dossiers|ventes/<id>/checklists/<item>.<ext>
--                   (AJOUT proposé) <org>/<dossier>/courriers/<courrier>.pdf
--   vehicule-docs : <org>/<objet>/<type_doc>.<ext>
--   objet-photos  : <org>/<objet>.<ext>   (passe de public à privé)
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('dossier-docs',  'dossier-docs',  false),
  ('vehicule-docs', 'vehicule-docs', false),
  ('objet-photos',  'objet-photos',  false)
on conflict (id) do update set public = false;

drop policy if exists "marto_storage_select_meme_org" on storage.objects;
drop policy if exists "marto_storage_insert_meme_org" on storage.objects;
drop policy if exists "marto_storage_update_meme_org" on storage.objects;
drop policy if exists "marto_storage_delete_meme_org" on storage.objects;

-- Lecture et URL signées : fichiers des 3 buckets dont le premier dossier est son organisation.
create policy "marto_storage_select_meme_org" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('dossier-docs', 'vehicule-docs', 'objet-photos')
    and (storage.foldername(name))[1] = (select public.auth_organisation_id())::text
  );

-- Dépôt : uniquement sous le préfixe de son organisation.
create policy "marto_storage_insert_meme_org" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('dossier-docs', 'vehicule-docs', 'objet-photos')
    and (storage.foldername(name))[1] = (select public.auth_organisation_id())::text
  );

-- Remplacement (upload avec upsert: true) : sous son préfixe, sans pouvoir déplacer le fichier ailleurs.
create policy "marto_storage_update_meme_org" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('dossier-docs', 'vehicule-docs', 'objet-photos')
    and (storage.foldername(name))[1] = (select public.auth_organisation_id())::text
  )
  with check (
    bucket_id in ('dossier-docs', 'vehicule-docs', 'objet-photos')
    and (storage.foldername(name))[1] = (select public.auth_organisation_id())::text
  );

-- Suppression : sous le préfixe de son organisation uniquement.
create policy "marto_storage_delete_meme_org" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('dossier-docs', 'vehicule-docs', 'objet-photos')
    and (storage.foldername(name))[1] = (select public.auth_organisation_id())::text
  );
