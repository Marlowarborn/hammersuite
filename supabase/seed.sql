-- =============================================================================
-- 0003_seed_dev.sql : données de démonstration, DÉVELOPPEMENT LOCAL UNIQUEMENT
-- -----------------------------------------------------------------------------
-- Ne pas placer dans supabase/migrations/ (sinon "supabase db push" l'envoie en
-- production). À copier en supabase/seed.sql : "supabase db reset" l'exécute
-- après les migrations. Optionnel.
--
-- Suppose 0001 et 0002 appliqués (le trigger handle_new_user crée l'étude et le
-- profil admin à partir de l'utilisateur de démonstration).
-- Toutes les données sont fictives : aucun nom, adresse ou identifiant réel.
-- Les checklists ne sont pas seedées : l'application les crée à l'ouverture du
-- dossier (ensureChecklist).
-- Idempotent : un second passage ne fait rien.
-- =============================================================================

do $$
declare
  v_user     uuid := '00000000-0000-4000-8000-0000000000d1';
  v_org      uuid;
  v_vente    uuid := '00000000-0000-4000-8000-0000000000a1';
  v_dossier  uuid := '00000000-0000-4000-8000-0000000000b1';
  v_objet_1  uuid := '00000000-0000-4000-8000-0000000000c1';
  v_objet_2  uuid := '00000000-0000-4000-8000-0000000000c2';
  v_objet_3  uuid := '00000000-0000-4000-8000-0000000000c3';
begin
  -- 1. Utilisateur de démonstration (mot de passe local de démo, à changer si besoin).
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  )
  values (
    v_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'demo@marto.test', extensions.crypt('demo-marto-local', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Utilisateur Démo", "organisation_name": "Étude de démonstration"}'::jsonb,
    now(), now(), '', '', '', ''
  )
  on conflict (id) do nothing;

  -- Identité email : nécessaire à la connexion par mot de passe sur GoTrue récent.
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (
    v_user, v_user, v_user::text, 'email',
    jsonb_build_object('sub', v_user::text, 'email', 'demo@marto.test', 'email_verified', true),
    now(), now(), now()
  )
  on conflict do nothing;

  select p.organisation_id into v_org from public.profiles p where p.id = v_user;
  if v_org is null then
    raise exception 'Profil de démonstration absent : 0002_rls.sql (trigger handle_new_user) est-il appliqué ?';
  end if;

  if exists (select 1 from public.dossiers d where d.id = v_dossier) then
    raise notice 'Seed de démonstration déjà présent, rien à faire.';
    return;
  end if;

  -- 2. Coordonnées fictives de l'étude.
  update public.organisations set
    adresse             = '1 rue de l''Exemple',
    code_postal         = '00000',
    ville               = 'Démoville',
    telephone           = '00 00 00 00 00',
    email               = 'contact@marto.test',
    siret               = '00000000000000',
    iban                = 'FR00 0000 0000 0000 0000 0000 000',
    numero_tva_intracom = 'FR00000000000'
  where id = v_org;

  update public.profiles set qualite = 'Commissaire de justice (fictif)' where id = v_user;

  -- 3. Une vente volontaire.
  insert into public.ventes (id, organisation_id, name, "date", location, category, notes, status, lots, estimate)
  values (v_vente, v_org, 'Vente de démonstration', current_date + 30, 'Salle de démonstration',
          'Mobilier & Objets d''art', 'Vente fictive pour le développement local.', 'upcoming', 0, '—');

  -- 4. Un dossier judiciaire.
  insert into public.dossiers (
    id, organisation_id, numero, nature, statut, phase, date_ouverture, date_jugement,
    debiteur_nom, debiteur_forme_juridique, debiteur_adresse, debiteur_code_postal, debiteur_ville,
    tribunal, numero_greffe, juge_commissaire, mandataire, gerant_nom, gerant_email,
    societe_assujettie_tva, commentaires
  )
  values (
    v_dossier, v_org, 'DEMO-0001', 'Liquidation Judiciaire', 'en_cours', 'inventaire',
    current_date - 20, current_date - 25,
    'Société Fictive', 'SARL', '2 avenue de l''Exemple', '00000', 'Démoville',
    'Tribunal de commerce de Démoville', 'G-DEMO-0001', 'Juge Exemple', 'Mandataire Exemple',
    'Gérant Exemple', 'gerant@marto.test', true, 'Dossier fictif de démonstration.'
  );

  insert into public.dossier_lieux (organisation_id, dossier_id, adresse, contact_nom, contact_telephone, notes)
  values (v_org, v_dossier, '3 impasse de l''Entrepôt, 00000 Démoville', 'Contact Exemple', '00 00 00 00 01',
          'Entrepôt fictif.');

  insert into public.dossier_contrats (organisation_id, dossier_id, type, description, restituer_avant)
  values (v_org, v_dossier, 'leasing', 'Contrat de leasing fictif (véhicule utilitaire).', current_date + 60);

  -- 5. Trois objets : deux dans le dossier judiciaire, un au répertoire volontaire.
  insert into public.objets (
    id, organisation_id, dossier_id, numero_repertoire, type_entree, rubrique, titre, description,
    etat, valeur_exploitation, valeur_reprise, estimation_basse, estimation_haute, status
  )
  values
    (v_objet_1, v_org, v_dossier, public.next_numero_repertoire(v_org), 'judiciaire', 'mobilier',
     'Bureau en bois (démo)', 'Bureau en bois, deux tiroirs (objet fictif).',
     'Bon état', 300, 120, 80, 150, 'attribue'),
    (v_objet_2, v_org, v_dossier, public.next_numero_repertoire(v_org), 'judiciaire', 'vehicule',
     'Véhicule utilitaire (démo)', 'Fourgon utilitaire (objet fictif).',
     'Usagé', 9000, 5000, 4000, 6000, 'attribue');

  insert into public.objets (
    id, organisation_id, numero_repertoire, type_entree, titre, technique, epoque, description,
    consignateur, estimation_basse, estimation_haute, status, genere_par_ia
  )
  values
    (v_objet_3, v_org, public.next_numero_repertoire(v_org), 'volontaire',
     'Vase en céramique (démo)', 'Céramique émaillée', 'XXe siècle', 'Vase fictif de démonstration.',
     'Déposant Exemple', 100, 200, 'en_attente', true);

  -- 6. Une entrée de journal.
  insert into public.activity_log (organisation_id, user_id, entity_type, entity_id, action, details)
  values (v_org, v_user, 'dossier', v_dossier, 'seeded', '{"source": "0003_seed_dev.sql"}'::jsonb);

  raise notice 'Seed de démonstration créé (organisation %).', v_org;
end
$$;
