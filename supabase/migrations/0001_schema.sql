-- =============================================================================
-- 0001_schema.sql : schéma de base de HammerSuite / Marto.io
-- -----------------------------------------------------------------------------
-- Reconstitué à partir du code (branche reprise/phase-0, 2026-10-06) : chaque
-- appel .from("<table>") de app/, components/ et lib/ a été relevé (62 appels,
-- 11 tables). Le code est la seule source de vérité : toute colonne, table ou
-- contrainte absente du code est marquée "-- AJOUT :" avec sa raison.
--
-- Suppose : un projet Supabase (schémas auth et storage, rôles anon,
-- authenticated et service_role, fonction auth.uid()). Postgres 15 minimum
-- (clause "on delete set null (colonne)" des clés étrangères composites).
-- Idempotent autant que raisonnable : if not exists, create or replace.
-- Les politiques RLS, les droits et le trigger d'inscription sont dans 0002.
-- Le fichier historique 20260518_step7_courriers.sql devient sans effet :
-- toutes ses colonnes et son index sont déjà créés ici.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Extensions et fonctions utilitaires
-- -----------------------------------------------------------------------------

create schema if not exists extensions;
-- gen_random_uuid() est natif depuis Postgres 13 ; pgcrypto sert au seed local
-- (crypt, gen_salt) et est déjà présent sur Supabase.
create extension if not exists pgcrypto with schema extensions;

-- Tient à jour la colonne updated_at à chaque modification de ligne.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 1. organisations : une étude (maison de ventes), le locataire de l'application
--    Code : app/signup, app/dashboard/settings, components/app/Topbar,
--    app/api/generate-courrier (select *), lib/courrier-payload (bloc "etude").
-- -----------------------------------------------------------------------------

create table if not exists public.organisations (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text,               -- sous-domaine affiché à l'inscription (<slug>.marto.io)
  adresse             text,
  code_postal         text,
  ville               text,
  telephone           text,
  email               text,
  siret               text,
  iban                text,
  -- AJOUT : mention obligatoire sur une facture entre professionnels (notes d'honoraires) ; absente du code et du payload PDFMonkey.
  numero_tva_intracom text,
  created_at          timestamptz not null default now(),
  -- AJOUT : updated_at sur toutes les tables modifiables (le code ne le lit jamais).
  updated_at          timestamptz not null default now()
);

-- AJOUT (contrainte) : le slug sert d'adresse <slug>.marto.io, il doit être unique.
create unique index if not exists organisations_slug_key
  on public.organisations (slug) where slug is not null;


-- -----------------------------------------------------------------------------
-- 2. profiles : un utilisateur authentifié, rattaché à une seule organisation
--    Code : app/signup (update), settings (select, update), Topbar, saisie,
--    sales, lots, dossiers (select organisation_id), generate-courrier.
--    Valeurs de role vues dans le code : "admin", "member" (et "user", traité
--    comme "member" par l'affichage : non retenu dans la contrainte).
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  full_name       text,
  email           text,
  qualite         text,                   -- qualité du signataire des courriers (ex. commissaire de justice)
  role            text not null default 'member'
                  constraint profiles_role_check check (role in ('admin', 'member')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists profiles_organisation_id_idx on public.profiles (organisation_id);


-- -----------------------------------------------------------------------------
-- 3. invitations
-- AJOUT : table absente du code. Aujourd'hui l'invitation (settings) envoie un
-- magic link avec des métadonnées { organisation_id, invited_by, role } que
-- n'importe quel client peut forger. Le trigger handle_new_user (0002) ne
-- rattache un nouvel utilisateur à une organisation que si une ligne
-- d'invitation valide existe ici pour son email.
-- -----------------------------------------------------------------------------

create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  email           text not null
                  constraint invitations_email_check check (email = lower(btrim(email)) and position('@' in email) > 1),
  role            text not null default 'member'
                  constraint invitations_role_check check (role in ('admin', 'member')),
  invited_by      uuid default auth.uid() references auth.users (id) on delete set null,
  expires_at      timestamptz not null default (now() + interval '7 days'),
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Une seule invitation ouverte par email et par organisation.
create unique index if not exists invitations_ouverte_key
  on public.invitations (organisation_id, email) where accepted_at is null;
create index if not exists invitations_email_idx on public.invitations (email);


-- -----------------------------------------------------------------------------
-- 4. ventes : ventes aux enchères (volontaires)
--    Code : app/dashboard/sales (select *, insert), lib/checklists (vente_id).
-- -----------------------------------------------------------------------------

create table if not exists public.ventes (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name            text not null,
  "date"          date not null,           -- champ <input type="date">
  location        text,
  category        text,                    -- libellé libre (liste CATEGORIES du front)
  notes           text,
  status          text not null default 'upcoming'
                  constraint ventes_status_check check (status in ('upcoming', 'active', 'completed')),
  lots            integer not null default 0 constraint ventes_lots_check check (lots >= 0),
  estimate        text,                    -- type deviné : le code insère "—" et affiche tel quel
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Cible des clés étrangères composites (garantit qu'un enfant reste dans la même organisation).
  constraint ventes_id_organisation_key unique (id, organisation_id)
);

create index if not exists ventes_organisation_created_idx
  on public.ventes (organisation_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 5. dossiers : dossiers judiciaires (liquidation, redressement, etc.)
--    Code : components/app/DossierForm (insert, update), app/dashboard/dossiers
--    (select *), dossiers/[id] (select *, update phase), generate-courrier,
--    lib/courrier-payload (type Dossier).
-- -----------------------------------------------------------------------------

create table if not exists public.dossiers (
  id                          uuid primary key default gen_random_uuid(),
  organisation_id             uuid not null references public.organisations (id) on delete cascade,
  numero                      text not null,           -- saisi à la main (ex. TC21136), obligatoire dans le formulaire
  nature                      text,                    -- liste NATURES du front ("Liquidation Judiciaire", ...) : laissée libre
  statut                      text not null default 'en_cours'
                              constraint dossiers_statut_check check (statut in ('en_cours', 'suspendu', 'cloture')),
  phase                       text
                              constraint dossiers_phase_check check (phase in (
                                'ouverture', 'contact_gerant', 'inventaire', 'preparation_vente',
                                'vente', 'restitution', 'cloture')),  -- ids de PHASES_JUDICIAIRE (lib/checklists.ts)
  date_ouverture              date default current_date,
  date_vente                  date,
  date_jugement               date,
  decret                      text,
  securigreffe_id             text,
  -- Débiteur
  debiteur_nom                text not null,           -- obligatoire dans le formulaire
  debiteur_forme_juridique    text,
  debiteur_adresse            text,
  debiteur_code_postal        text,
  debiteur_ville              text,
  -- Tribunal et intervenants
  tribunal                    text,
  numero_greffe               text,
  greffe_adresse              text,
  juge_commissaire            text,
  juge_commissaire_adresse    text,
  mandataire                  text,
  mandataire_adresse          text,
  administrateur              text,
  administrateur_adresse      text,
  -- Gérant et société
  gerant_nom                  text,
  gerant_adresse              text,
  gerant_telephone            text,
  gerant_email                text,
  societe_assujettie_tva      boolean not null default false,
  conseil_nom                 text,
  autres_membres              text,
  -- Suivi interne
  correspondant               text,
  correspondant_email         text,
  signataire                  text,
  collaborateur               text,
  declaration_honneur_signee  boolean not null default false,
  declaration_honneur_url     text,                    -- URL signée 1 an (bucket dossier-docs) : expire
  -- AJOUT : chemin du fichier dans le bucket privé dossier-docs, pour signer une URL à la demande au lieu de stocker une URL qui expire.
  declaration_honneur_path    text,
  commentaires                text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint dossiers_id_organisation_key unique (id, organisation_id)
);

create index if not exists dossiers_organisation_created_idx
  on public.dossiers (organisation_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 6. objets : le répertoire (livre de police) des biens confiés
--    Code : app/saisie (insert), app/dashboard/lots (select *, insert, update,
--    import en masse), dossiers/[id] (select *, update dossier_id + status),
--    ObjetJudiciaireForm (insert, update photo_url), lib/courrier-payload.
--    vente_id, numero_lot et prix_adjudication sont lus (types TS) mais jamais
--    écrits par le code actuel.
-- -----------------------------------------------------------------------------

create table if not exists public.objets (
  id                   uuid primary key default gen_random_uuid(),
  organisation_id      uuid not null references public.organisations (id) on delete cascade,
  dossier_id           uuid,
  vente_id             uuid,
  numero_repertoire    text not null,            -- format "AAAA-NNN", voir next_numero_repertoire()
  date_entree          date not null default current_date,
  type_entree          text not null default 'volontaire'
                       constraint objets_type_entree_check check (type_entree in ('volontaire', 'judiciaire', 'depot')),
  rubrique             text
                       constraint objets_rubrique_check check (rubrique in (
                         'materiel', 'mobilier', 'vehicule', 'stock', 'leasing', 'location', 'depot')),
  titre                text,
  description          text,
  artiste              text,
  dimensions           text,
  technique            text,
  epoque               text,
  provenance           text,
  consignateur         text,
  etat                 text,
  estimation_basse     numeric(12, 2) default 0,
  estimation_haute     numeric(12, 2) default 0,
  valeur_exploitation  numeric(12, 2),
  valeur_reprise       numeric(12, 2),
  status               text not null default 'en_attente'
                       constraint objets_status_check check (status in ('en_attente', 'attribue', 'vendu', 'invendu', 'restitue')),
  numero_lot           text,
  prix_adjudication    numeric(12, 2),
  photo_url            text,                     -- aujourd'hui getPublicUrl() : cassé une fois le bucket privé
  -- AJOUT : chemin de la photo dans le bucket objet-photos (désormais privé), à signer à l'affichage et pour PDFMonkey.
  photo_path           text,
  -- AJOUT : vrai si titre/technique/époque/description viennent de /api/analyze-photo (traçabilité de la saisie assistée par IA).
  genere_par_ia        boolean not null default false,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint objets_id_organisation_key unique (id, organisation_id),
  -- Numéro de répertoire unique par étude (le code calcule aujourd'hui max+1 côté client : collisions possibles).
  constraint objets_numero_repertoire_key unique (organisation_id, numero_repertoire),
  -- Clés composites : un objet ne peut pointer que vers un dossier ou une vente de sa propre organisation.
  constraint objets_dossier_fk foreign key (dossier_id, organisation_id)
    references public.dossiers (id, organisation_id) on delete set null (dossier_id),
  constraint objets_vente_fk foreign key (vente_id, organisation_id)
    references public.ventes (id, organisation_id) on delete set null (vente_id)
);

create index if not exists objets_organisation_created_idx
  on public.objets (organisation_id, created_at desc);
create index if not exists objets_dossier_id_idx on public.objets (dossier_id);
create index if not exists objets_vente_id_idx on public.objets (vente_id);


-- -----------------------------------------------------------------------------
-- 7. vehicule_docs : pièces d'un véhicule (une ligne par objet de rubrique vehicule)
--    Code : ObjetJudiciaireForm (insert uniquement, jamais relu).
--    Les *_url contiennent une URL signée 1 an, ou le chemin brut en repli.
-- -----------------------------------------------------------------------------

create table if not exists public.vehicule_docs (
  id                      uuid primary key default gen_random_uuid(),
  organisation_id         uuid not null references public.organisations (id) on delete cascade,
  objet_id                uuid not null,
  non_gage_url            text,
  cg_url                  text,
  fiv_url                 text,
  controle_technique_url  text,
  certificat_vente_url    text,
  certificat_cession_url  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint vehicule_docs_objet_fk foreign key (objet_id, organisation_id)
    references public.objets (id, organisation_id) on delete cascade
);

create index if not exists vehicule_docs_organisation_id_idx on public.vehicule_docs (organisation_id);
create index if not exists vehicule_docs_objet_id_idx on public.vehicule_docs (objet_id);


-- -----------------------------------------------------------------------------
-- 8. dossier_lieux : lieux de stockage des biens d'un dossier
--    Code : components/app/LieuxSection (select *, insert, delete), courrier-payload.
-- -----------------------------------------------------------------------------

create table if not exists public.dossier_lieux (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null references public.organisations (id) on delete cascade,
  dossier_id         uuid not null,
  adresse            text not null,            -- obligatoire dans le formulaire
  contact_nom        text,
  contact_telephone  text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint dossier_lieux_dossier_fk foreign key (dossier_id, organisation_id)
    references public.dossiers (id, organisation_id) on delete cascade
);

create index if not exists dossier_lieux_organisation_id_idx on public.dossier_lieux (organisation_id);
create index if not exists dossier_lieux_dossier_id_idx on public.dossier_lieux (dossier_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 9. dossier_contrats : contrats annexes (location, leasing, dépôt, CG)
--    Code : components/app/ContratsSection (select *, insert, update fichier_url,
--    delete), courrier-payload. Valeurs de type : CONTRAT_TYPE_LABELS (lib/labels.ts).
-- -----------------------------------------------------------------------------

create table if not exists public.dossier_contrats (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations (id) on delete cascade,
  dossier_id       uuid not null,
  type             text not null default 'location'
                   constraint dossier_contrats_type_check check (type in ('location', 'leasing', 'depot', 'cg', 'autre')),
  description      text,
  restituer_avant  date,
  fichier_url      text,                       -- URL signée 1 an (bucket dossier-docs) : expire
  -- AJOUT : chemin du fichier dans dossier-docs, à signer à la demande.
  fichier_path     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint dossier_contrats_dossier_fk foreign key (dossier_id, organisation_id)
    references public.dossiers (id, organisation_id) on delete cascade
);

create index if not exists dossier_contrats_organisation_id_idx on public.dossier_contrats (organisation_id);
create index if not exists dossier_contrats_dossier_id_idx on public.dossier_contrats (dossier_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 10. checklist_items : étapes de suivi par phase, rattachées à un dossier OU une vente
--     Code : lib/checklists (seedChecklist), PhaseChecklistDrawer (update is_done,
--     completed_at, completed_by, notes, doc_url ; ensureChecklist),
--     dossiers/[id] (select * order by ordre).
-- -----------------------------------------------------------------------------

create table if not exists public.checklist_items (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations (id) on delete cascade,
  dossier_id       uuid,
  vente_id         uuid,
  phase            text not null
                   constraint checklist_items_phase_check check (phase in (
                     -- PHASES_JUDICIAIRE
                     'ouverture', 'contact_gerant', 'inventaire', 'preparation_vente', 'vente', 'restitution', 'cloture',
                     -- PHASES_VOLONTAIRE ('vente' est commune aux deux)
                     'mandat', 'seance_photo', 'preparation', 'post_vente', 'decompte')),
  label            text not null,
  ordre            integer not null default 0,  -- index_phase * 100 + index_item
  is_done          boolean not null default false,
  completed_at     timestamptz,
  completed_by     uuid references auth.users (id) on delete set null,
  doc_url          text,                         -- URL signée 1 an (bucket dossier-docs) : expire
  -- AJOUT : chemin du justificatif dans dossier-docs, à signer à la demande.
  doc_path         text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Une checklist appartient soit à un dossier, soit à une vente (seedChecklist renseigne l'un des deux).
  constraint checklist_items_cible_check check (num_nonnulls(dossier_id, vente_id) = 1),
  constraint checklist_items_dossier_fk foreign key (dossier_id, organisation_id)
    references public.dossiers (id, organisation_id) on delete cascade,
  constraint checklist_items_vente_fk foreign key (vente_id, organisation_id)
    references public.ventes (id, organisation_id) on delete cascade
);

create index if not exists checklist_items_organisation_id_idx on public.checklist_items (organisation_id);
create index if not exists checklist_items_dossier_idx on public.checklist_items (dossier_id, ordre);
create index if not exists checklist_items_vente_idx on public.checklist_items (vente_id, ordre);

-- AJOUT (contrainte) : ensureChecklist() peut seeder deux fois en parallèle (double
-- effet React en dev, deux onglets) ; ces index font échouer le second lot au lieu
-- de dupliquer toute la checklist.
create unique index if not exists checklist_items_dossier_item_key
  on public.checklist_items (dossier_id, phase, label) where dossier_id is not null;
create unique index if not exists checklist_items_vente_item_key
  on public.checklist_items (vente_id, phase, label) where vente_id is not null;


-- -----------------------------------------------------------------------------
-- 11. courriers : documents générés via PDFMonkey
--     Code : app/api/generate-courrier (insert), app/api/courriers/refresh-url
--     (select, update pdf_url), CourriersTab (select *, update status + sent_at),
--     lib/courrier-payload (nextFactureReference). Valeurs : lib/labels.ts.
-- -----------------------------------------------------------------------------

create table if not exists public.courriers (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references public.organisations (id) on delete cascade,
  dossier_id        uuid,
  vente_id          uuid,
  type              text not null
                    constraint courriers_type_check check (type in (
                      'ordonnance', 'requete', 'der', 'note_honoraires', 'courrier_envoi', 'inventaire_judiciaire')),
  destinataire      text
                    constraint courriers_destinataire_check check (destinataire in (
                      'juge_commissaire', 'mandataire', 'administrateur', 'greffe', 'gerant')),
  reference         text,                          -- "NH-AAAA-NNN" pour les notes d'honoraires, sinon null
  status            text not null default 'draft'
                    constraint courriers_status_check check (status in ('draft', 'generated', 'sent')),
  pdf_url           text,                          -- URL de téléchargement PDFMonkey : expire, rafraîchie par refresh-url
  -- AJOUT : chemin du PDF archivé dans le bucket dossier-docs ; une note d'honoraires doit rester consultable sans dépendre de PDFMonkey.
  pdf_path          text,
  pdfmonkey_doc_id  text,
  generated_at      timestamptz,
  sent_at           timestamptz,
  created_by        uuid default auth.uid() references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Numéro de facture unique par étude (les références nulles ne se gênent pas).
  constraint courriers_reference_key unique (organisation_id, reference),
  -- Le code exige dossier_id ; vente_id est prévu par l'API (paramètre optionnel).
  constraint courriers_cible_check check (dossier_id is not null or vente_id is not null),
  -- restrict : on ne supprime pas un dossier qui porte des courriers (factures comprises).
  constraint courriers_dossier_fk foreign key (dossier_id, organisation_id)
    references public.dossiers (id, organisation_id) on delete restrict,
  constraint courriers_vente_fk foreign key (vente_id, organisation_id)
    references public.ventes (id, organisation_id) on delete restrict
);

create index if not exists courriers_dossier_idx on public.courriers (dossier_id, generated_at desc nulls last);
create index if not exists courriers_vente_id_idx on public.courriers (vente_id);
-- Index de la migration historique step7 (recherche max+1 par organisation, type et référence).
-- Inutile une fois le code passé à next_facture_reference() ; conservé pour la transition.
create index if not exists idx_courriers_reference_lookup
  on public.courriers (organisation_id, type, reference);


-- -----------------------------------------------------------------------------
-- 12. activity_log : journal d'activité (append-only)
--     Code : app/api/generate-courrier (insert entity_type "courrier", action "generated").
-- -----------------------------------------------------------------------------

create table if not exists public.activity_log (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations (id) on delete cascade,
  user_id          uuid default auth.uid() references auth.users (id) on delete set null,
  entity_type      text not null,                -- seule valeur vue : 'courrier'
  entity_id        uuid,                         -- type deviné : le code y met courrier.id
  action           text not null,                -- seule valeur vue : 'generated'
  details          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
  -- Pas de updated_at : journal en ajout seul (aucune modification autorisée, voir 0002).
);

create index if not exists activity_log_organisation_created_idx
  on public.activity_log (organisation_id, created_at desc);
create index if not exists activity_log_entity_idx
  on public.activity_log (entity_type, entity_id);


-- -----------------------------------------------------------------------------
-- 13. compteurs : séquences de numérotation par organisation et par année
-- AJOUT : table absente du code, qui calcule aujourd'hui max+1 côté client
-- (saisie, lots, ObjetJudiciaireForm, nextFactureReference) : deux saisies
-- simultanées obtiennent le même numéro. Lue et écrite uniquement par les
-- fonctions ci-dessous (aucun droit direct pour les clients, voir 0002).
-- -----------------------------------------------------------------------------

create table if not exists public.compteurs (
  organisation_id  uuid not null references public.organisations (id) on delete cascade,
  nature           text not null constraint compteurs_nature_check check (nature in ('facture', 'repertoire')),
  annee            integer not null constraint compteurs_annee_check check (annee between 2000 and 2999),
  dernier_numero   integer not null default 0 constraint compteurs_dernier_numero_check check (dernier_numero >= 0),
  updated_at       timestamptz not null default now(),
  primary key (organisation_id, nature, annee)
);


-- -----------------------------------------------------------------------------
-- 14. Triggers updated_at
-- -----------------------------------------------------------------------------

create or replace trigger set_updated_at before update on public.organisations    for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.profiles         for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.invitations      for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.ventes           for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.dossiers         for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.objets           for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.vehicule_docs    for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.dossier_lieux    for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.dossier_contrats for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.checklist_items  for each row execute function public.set_updated_at();
create or replace trigger set_updated_at before update on public.courriers        for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 15. Numérotation atomique (remplace les calculs max+1 du code)
-- -----------------------------------------------------------------------------

-- Incrémente atomiquement le compteur (organisation, nature, année) de p_quantite
-- et renvoie le dernier numéro attribué. "insert ... on conflict do update" pose
-- un verrou de ligne : deux appels simultanés obtiennent deux numéros distincts.
-- Un numéro attribué n'est jamais rendu : l'appelant doit l'utiliser (voir README
-- sur les trous de numérotation des factures).
create or replace function public._incrementer_compteur(
  p_org uuid,
  p_nature text,
  p_annee integer,
  p_quantite integer default 1
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dernier integer;
begin
  if p_org is null or p_annee is null then
    raise exception 'Organisation et année obligatoires' using errcode = '22004';
  end if;
  if p_quantite is null or p_quantite < 1 or p_quantite > 1000 then
    raise exception 'Quantité invalide : %', p_quantite using errcode = '22023';
  end if;
  -- Garde d'appartenance : un utilisateur connecté ne numérote que pour sa propre
  -- organisation. Sans JWT (service_role, SQL Editor), auth.uid() est null : autorisé.
  if auth.uid() is not null and not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.organisation_id = p_org
  ) then
    raise exception 'Organisation non autorisée' using errcode = '42501';
  end if;

  insert into public.compteurs as c (organisation_id, nature, annee, dernier_numero)
  values (p_org, p_nature, p_annee, p_quantite)
  on conflict (organisation_id, nature, annee)
  do update set dernier_numero = c.dernier_numero + excluded.dernier_numero,
                updated_at = now()
  returning c.dernier_numero into v_dernier;

  return v_dernier;
end;
$$;

-- Prochain numéro de répertoire, format "AAAA-NNN" (identique au code : 2026-001,
-- puis 2026-1000 au-delà de 999 sans troncature). Année par défaut : heure de Paris.
create or replace function public.next_numero_repertoire(
  org uuid,
  annee integer default extract(year from (now() at time zone 'Europe/Paris'))::integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  n := public._incrementer_compteur(org, 'repertoire', annee, 1);
  return annee::text || '-' || lpad(n::text, greatest(3, length(n::text)), '0');
end;
$$;

-- AJOUT : réservation d'un bloc de numéros pour l'import en masse (lots/page.tsx,
-- handleBulkImport) en un seul appel ; renvoie les numéros dans l'ordre.
create or replace function public.reserver_numeros_repertoire(
  org uuid,
  quantite integer,
  annee integer default extract(year from (now() at time zone 'Europe/Paris'))::integer
)
returns setof text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dernier integer;
begin
  v_dernier := public._incrementer_compteur(org, 'repertoire', annee, quantite);
  return query
    select annee::text || '-' || lpad(g::text, greatest(3, length(g::text)), '0')
    from generate_series(v_dernier - quantite + 1, v_dernier) as g
    order by g;
end;
$$;

-- Prochain numéro de note d'honoraires, format "NH-AAAA-NNN" (lib/courrier-payload.ts).
create or replace function public.next_facture_reference(
  org uuid,
  annee integer default extract(year from (now() at time zone 'Europe/Paris'))::integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  n := public._incrementer_compteur(org, 'facture', annee, 1);
  return 'NH-' || annee::text || '-' || lpad(n::text, greatest(3, length(n::text)), '0');
end;
$$;

-- Droits d'exécution : jamais anon ; la fonction interne n'est appelable que par les fonctions publiques.
revoke all on function public._incrementer_compteur(uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.next_numero_repertoire(uuid, integer) from public, anon;
revoke all on function public.reserver_numeros_repertoire(uuid, integer, integer) from public, anon;
revoke all on function public.next_facture_reference(uuid, integer) from public, anon;
grant execute on function public.next_numero_repertoire(uuid, integer) to authenticated, service_role;
grant execute on function public.reserver_numeros_repertoire(uuid, integer, integer) to authenticated, service_role;
grant execute on function public.next_facture_reference(uuid, integer) to authenticated, service_role;
