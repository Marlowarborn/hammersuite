-- =============================================================================
-- tests_rls.sql : scénarios d'isolation entre organisations
-- -----------------------------------------------------------------------------
-- À exécuter sur une base LOCALE (supabase start, puis supabase db reset), en
-- tant que postgres : psql "$(supabase status -o env | grep DB_URL ...)" -f
-- tests_rls.sql, ou coller dans le SQL Editor du Studio local.
-- Ne pas placer dans supabase/migrations/.
--
-- Tout se passe dans une transaction annulée à la fin : aucune donnée ne reste.
-- Un échec lève une exception "ECHEC ..." et interrompt le script ; un passage
-- complet se termine par la notice "TOUS LES TESTS RLS SONT PASSÉS".
--
-- Acteurs (identifiants fixes, emails en .test, tous fictifs) :
--   A  : admin de l'organisation A (inscription sans invitation)
--   A2 : membre de A, entré par une invitation valide
--   B  : admin de l'organisation B
--   X  : prétend rejoindre A par les métadonnées, sans invitation
--   Y  : invitation expirée vers A
--   W  : invitation valide vers A, mais aucune métadonnée d'invitation
--   V  : invitation valide vers A, indice envoyé sous la clé "organisation_id"
--        (celle qu'utilise aujourd'hui app/dashboard/settings)
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Fixtures (en tant que postgres : la RLS ne s'applique pas)
-- -----------------------------------------------------------------------------
do $$
declare
  u_a   uuid := '11111111-1111-4111-8111-111111111111';
  u_b   uuid := '22222222-2222-4222-8222-222222222222';
  u_a2  uuid := '33333333-3333-4333-8333-333333333333';
  u_x   uuid := '44444444-4444-4444-8444-444444444444';
  u_y   uuid := '55555555-5555-4555-8555-555555555555';
  u_w   uuid := '66666666-6666-4666-8666-666666666666';
  u_v   uuid := '77777777-7777-4777-8777-777777777777';
  org_a uuid;
  org_b uuid;
  o     uuid;
  v_vente uuid; v_dossier uuid; v_objet uuid; v_courrier uuid;
  suffixe text;
begin
  -- Comptes A et B : le trigger handle_new_user crée une organisation chacun.
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (u_a, 'authenticated', 'authenticated', 'a@marto.test',
     '{"full_name": "Utilisateur A", "organisation_name": "Étude A (test)"}', now(), now()),
    (u_b, 'authenticated', 'authenticated', 'b@marto.test',
     '{"full_name": "Utilisateur B", "organisation_name": "Étude B (test)"}', now(), now());

  select organisation_id into org_a from public.profiles where id = u_a;
  select organisation_id into org_b from public.profiles where id = u_b;
  assert org_a is not null and org_b is not null and org_a <> org_b,
    'ECHEC inscription : A et B doivent avoir chacun leur organisation';
  assert (select role from public.profiles where id = u_a) = 'admin',
    'ECHEC inscription : le créateur d''une organisation doit être admin';

  -- Invitations dans A : valide (A2), expirée (Y), valide sans indice (W).
  insert into public.invitations (organisation_id, email, role, invited_by, expires_at)
  values
    (org_a, 'a2@marto.test', 'member', u_a, now() + interval '7 days'),
    (org_a, 'y@marto.test',  'member', u_a, now() - interval '1 day'),
    (org_a, 'w@marto.test',  'member', u_a, now() + interval '7 days'),
    (org_a, 'v2@marto.test', 'member', u_a, now() + interval '7 days');
  -- Invitation ouverte dans B (pour vérifier que A ne la voit pas).
  insert into public.invitations (organisation_id, email, role, invited_by)
  values (org_b, 'b2@marto.test', 'member', u_b);

  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (u_a2, 'authenticated', 'authenticated', 'a2@marto.test',
     jsonb_build_object('full_name', 'Membre A2', 'invitation_org_id', org_a), now(), now()),
    (u_x, 'authenticated', 'authenticated', 'x@marto.test',
     jsonb_build_object('full_name', 'Intrus X', 'invitation_org_id', org_a, 'role', 'admin'), now(), now()),
    (u_y, 'authenticated', 'authenticated', 'y@marto.test',
     jsonb_build_object('full_name', 'Retardataire Y', 'invitation_org_id', org_a), now(), now()),
    (u_w, 'authenticated', 'authenticated', 'w@marto.test',
     jsonb_build_object('full_name', 'Sans indice W'), now(), now()),
    (u_v, 'authenticated', 'authenticated', 'v2@marto.test',
     jsonb_build_object('full_name', 'Membre V', 'organisation_id', org_a, 'invited_by', u_a, 'role', 'member'), now(), now());

  -- Trigger d'inscription
  assert (select organisation_id = org_a and role = 'member' from public.profiles where id = u_a2),
    'ECHEC invitation : A2 doit rejoindre A comme membre';
  assert (select accepted_at is not null from public.invitations where email = 'a2@marto.test'),
    'ECHEC invitation : l''invitation de A2 doit être marquée acceptée';
  assert (select organisation_id <> org_a and role = 'admin' from public.profiles where id = u_x),
    'ECHEC invitation : X (métadonnées seules) ne doit pas rejoindre A';
  assert (select organisation_id <> org_a from public.profiles where id = u_y),
    'ECHEC invitation : une invitation expirée ne doit pas rattacher Y à A';
  assert (select organisation_id <> org_a from public.profiles where id = u_w),
    'ECHEC invitation : sans indice dans les métadonnées, W crée sa propre organisation';
  assert (select organisation_id = org_a and role = 'member' from public.profiles where id = u_v),
    'ECHEC invitation : V (clé organisation_id du code actuel + invitation valide) doit rejoindre A';

  -- Une ligne par table métier dans chaque organisation (A puis B).
  foreach o in array array[org_a, org_b] loop
    suffixe := case when o = org_a then 'a' else 'b' end;

    insert into public.ventes (organisation_id, name, "date")
    values (o, 'Vente test ' || suffixe, current_date) returning id into v_vente;

    insert into public.dossiers (organisation_id, numero, debiteur_nom)
    values (o, 'TEST-' || suffixe, 'Débiteur test ' || suffixe) returning id into v_dossier;

    insert into public.objets (organisation_id, dossier_id, numero_repertoire, titre, type_entree, rubrique)
    values (o, v_dossier, public.next_numero_repertoire(o, 2026), 'Objet test ' || suffixe, 'judiciaire', 'vehicule')
    returning id into v_objet;

    insert into public.vehicule_docs (organisation_id, objet_id, cg_url) values (o, v_objet, 'test');
    insert into public.dossier_lieux (organisation_id, dossier_id, adresse) values (o, v_dossier, 'Adresse test');
    insert into public.dossier_contrats (organisation_id, dossier_id, type) values (o, v_dossier, 'location');
    insert into public.checklist_items (organisation_id, dossier_id, phase, label, ordre)
    values (o, v_dossier, 'ouverture', 'Item test', 0);
    insert into public.checklist_items (organisation_id, vente_id, phase, label, ordre)
    values (o, v_vente, 'mandat', 'Item test', 0);

    insert into public.courriers (organisation_id, dossier_id, type, reference, status)
    values (o, v_dossier, 'note_honoraires', public.next_facture_reference(o, 2026), 'generated')
    returning id into v_courrier;

    insert into public.activity_log (organisation_id, user_id, entity_type, entity_id, action)
    values (o, case when o = org_a then u_a else u_b end, 'courrier', v_courrier, 'generated');

    insert into storage.objects (bucket_id, name) values ('dossier-docs', o::text || '/' || v_dossier::text || '/test.pdf');

    perform set_config('test.' || suffixe || '_vente', v_vente::text, true);
    perform set_config('test.' || suffixe || '_dossier', v_dossier::text, true);
    perform set_config('test.' || suffixe || '_objet', v_objet::text, true);
  end loop;

  assert (select reference from public.courriers where organisation_id = org_a) = 'NH-2026-001',
    'ECHEC numérotation : première facture de A attendue NH-2026-001';
  assert (select reference from public.courriers where organisation_id = org_b) = 'NH-2026-001',
    'ECHEC numérotation : les compteurs doivent être indépendants par organisation';
  assert (select numero_repertoire from public.objets where organisation_id = org_a) = '2026-001',
    'ECHEC numérotation : premier numéro de répertoire de A attendu 2026-001';

  -- Buckets
  assert (select count(*) from storage.buckets where id in ('dossier-docs', 'vehicule-docs', 'objet-photos') and not public) = 3,
    'ECHEC storage : les 3 buckets doivent exister et être privés';

  perform set_config('test.org_a', org_a::text, true);
  perform set_config('test.org_b', org_b::text, true);
  raise notice 'Fixtures prêtes (A = %, B = %)', org_a, org_b;
end
$$;


-- -----------------------------------------------------------------------------
-- 1. Utilisateur A (admin de A) face aux données de B
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

do $$
declare
  org_a     uuid := current_setting('test.org_a')::uuid;
  org_b     uuid := current_setting('test.org_b')::uuid;
  b_dossier uuid := current_setting('test.b_dossier')::uuid;
  b_objet   uuid := current_setting('test.b_objet')::uuid;
  b_vente   uuid := current_setting('test.b_vente')::uuid;
  a_dossier uuid := current_setting('test.a_dossier')::uuid;
  a_objet   uuid := current_setting('test.a_objet')::uuid;
  t text; c text; paire text[]; stmt text; n bigint; ref text; numeros text[];
begin
  assert public.auth_organisation_id() = org_a, 'ECHEC : auth_organisation_id() doit renvoyer A';

  -- 1.1 Lecture : rien de B, et les fixtures de A sont bien visibles.
  foreach t in array array['profiles', 'invitations', 'ventes', 'dossiers', 'objets', 'vehicule_docs',
                           'dossier_lieux', 'dossier_contrats', 'checklist_items', 'courriers', 'activity_log'] loop
    execute format('select count(*) from public.%I where organisation_id = $1', t) into n using org_b;
    assert n = 0, format('ECHEC lecture : A voit %s ligne(s) de B dans %s', n, t);
    execute format('select count(*) from public.%I where organisation_id = $1', t) into n using org_a;
    assert n > 0, format('Fixture invalide : A ne voit aucune ligne de sa propre organisation dans %s', t);
  end loop;
  select count(*) into n from public.organisations where id = org_b;
  assert n = 0, 'ECHEC lecture : A voit l''organisation B';
  select count(*) into n from public.organisations;
  assert n = 1, 'ECHEC lecture : A doit voir exactement une organisation';
  select count(*) into n from storage.objects where name like org_b::text || '/%';
  assert n = 0, 'ECHEC storage : A voit des fichiers de B';
  select count(*) into n from storage.objects where name like org_a::text || '/%';
  assert n > 0, 'Fixture invalide : A ne voit pas ses propres fichiers';

  -- 1.2 Modification : aucune ligne de B touchée (filtrée par la RLS ou refusée par les droits).
  foreach paire slice 1 in array array[
      ['profiles', 'full_name'], ['invitations', 'role'], ['ventes', 'notes'], ['dossiers', 'commentaires'],
      ['objets', 'notes'], ['vehicule_docs', 'cg_url'], ['dossier_lieux', 'notes'],
      ['dossier_contrats', 'description'], ['checklist_items', 'notes'], ['courriers', 'status'],
      ['activity_log', 'action']] loop
    t := paire[1];
    c := paire[2];
    begin
      execute format('update public.%I set %I = %I where organisation_id = $1', t, c, c) using org_b;
      get diagnostics n = row_count;
    exception when insufficient_privilege then
      n := 0;
    end;
    assert n = 0, format('ECHEC modification : A a modifié %s ligne(s) de B dans %s', n, t);
  end loop;
  update public.organisations set name = name where id = org_b;
  get diagnostics n = row_count;
  assert n = 0, 'ECHEC modification : A a modifié l''organisation B';

  -- 1.3 Suppression : aucune ligne de B supprimée.
  foreach t in array array['profiles', 'invitations', 'ventes', 'dossiers', 'objets', 'vehicule_docs',
                           'dossier_lieux', 'dossier_contrats', 'checklist_items', 'courriers', 'activity_log'] loop
    begin
      execute format('delete from public.%I where organisation_id = $1', t) using org_b;
      get diagnostics n = row_count;
    exception when insufficient_privilege then
      n := 0;
    end;
    assert n = 0, format('ECHEC suppression : A a supprimé %s ligne(s) de B dans %s', n, t);
  end loop;
  begin
    delete from public.organisations where id = org_b;
    get diagnostics n = row_count;
  exception when insufficient_privilege then
    n := 0;
  end;
  assert n = 0, 'ECHEC suppression : A a supprimé l''organisation B';
  delete from storage.objects where name like org_b::text || '/%';
  get diagnostics n = row_count;
  assert n = 0, 'ECHEC storage : A a supprimé des fichiers de B';

  -- 1.4 Création dans B : toujours refusée.
  foreach stmt in array array[
      format('insert into public.organisations (name) values (%L)', 'Organisation intruse'),
      format('insert into public.profiles (id, organisation_id) values (gen_random_uuid(), %L)', org_b),
      format('insert into public.invitations (organisation_id, email, invited_by) values (%L, %L, auth.uid())', org_b, 'z@marto.test'),
      format('insert into public.ventes (organisation_id, name, "date") values (%L, %L, current_date)', org_b, 'Intrus'),
      format('insert into public.dossiers (organisation_id, numero, debiteur_nom) values (%L, %L, %L)', org_b, 'X', 'X'),
      format('insert into public.objets (organisation_id, numero_repertoire) values (%L, %L)', org_b, '1999-999'),
      format('insert into public.vehicule_docs (organisation_id, objet_id) values (%L, %L)', org_b, b_objet),
      format('insert into public.dossier_lieux (organisation_id, dossier_id, adresse) values (%L, %L, %L)', org_b, b_dossier, 'X'),
      format('insert into public.dossier_contrats (organisation_id, dossier_id, type) values (%L, %L, %L)', org_b, b_dossier, 'autre'),
      format('insert into public.checklist_items (organisation_id, dossier_id, phase, label) values (%L, %L, %L, %L)', org_b, b_dossier, 'ouverture', 'X'),
      format('insert into public.courriers (organisation_id, dossier_id, type) values (%L, %L, %L)', org_b, b_dossier, 'ordonnance'),
      format('insert into public.activity_log (organisation_id, entity_type, action) values (%L, %L, %L)', org_b, 'test', 'test'),
      format('insert into storage.objects (bucket_id, name) values (%L, %L)', 'dossier-docs', org_b::text || '/intrus.pdf')] loop
    begin
      execute stmt;
      raise exception 'ECHEC création acceptée dans B : %', stmt;
    exception when insufficient_privilege then
      null;  -- attendu : RLS (with check) ou droit de table
    end;
  end loop;

  -- 1.5 Rattachement d'une ligne de A à un parent de B : refusé par les clés composites.
  foreach stmt in array array[
      format('insert into public.objets (organisation_id, dossier_id, numero_repertoire) values (%L, %L, %L)', org_a, b_dossier, '1999-998'),
      format('insert into public.objets (organisation_id, vente_id, numero_repertoire) values (%L, %L, %L)', org_a, b_vente, '1999-997'),
      format('insert into public.dossier_lieux (organisation_id, dossier_id, adresse) values (%L, %L, %L)', org_a, b_dossier, 'X'),
      format('insert into public.dossier_contrats (organisation_id, dossier_id, type) values (%L, %L, %L)', org_a, b_dossier, 'autre'),
      format('insert into public.checklist_items (organisation_id, dossier_id, phase, label) values (%L, %L, %L, %L)', org_a, b_dossier, 'ouverture', 'X'),
      format('insert into public.courriers (organisation_id, dossier_id, type) values (%L, %L, %L)', org_a, b_dossier, 'ordonnance'),
      format('insert into public.vehicule_docs (organisation_id, objet_id) values (%L, %L)', org_a, b_objet),
      format('update public.objets set dossier_id = %L where id = %L', b_dossier, a_objet)] loop
    begin
      execute stmt;
      raise exception 'ECHEC rattachement inter-organisations accepté : %', stmt;
    exception when foreign_key_violation then
      null;  -- attendu
    end;
  end loop;

  -- 1.6 Déplacer une ligne de A vers B : refusé (with check des politiques update).
  begin
    update public.dossiers set organisation_id = org_b where id = a_dossier;
    raise exception 'ECHEC : A a déplacé un dossier vers B';
  exception when insufficient_privilege or foreign_key_violation then
    null;
  end;

  -- 1.7 Numérotation : séquentielle pour A, refusée pour B, compteurs inaccessibles.
  ref := public.next_facture_reference(org_a, 2026);
  assert ref = 'NH-2026-002', format('ECHEC numérotation : NH-2026-002 attendu, obtenu %s', ref);
  ref := public.next_numero_repertoire(org_a, 2026);
  assert ref = '2026-002', format('ECHEC numérotation : 2026-002 attendu, obtenu %s', ref);
  select array_agg(x order by x) into numeros from public.reserver_numeros_repertoire(org_a, 3, 2026) as x;
  assert numeros = array['2026-003', '2026-004', '2026-005'],
    format('ECHEC réservation : 2026-003..005 attendus, obtenu %s', numeros);
  begin
    perform public.next_facture_reference(org_b, 2026);
    raise exception 'ECHEC : A a obtenu un numéro de facture de B';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.next_numero_repertoire(org_b, 2026);
    raise exception 'ECHEC : A a obtenu un numéro de répertoire de B';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform count(*) from public.compteurs;
    raise exception 'ECHEC : la table compteurs est lisible par un client';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public._incrementer_compteur(org_a, 'facture', 2026, 1);
    raise exception 'ECHEC : la fonction interne _incrementer_compteur est appelable par un client';
  exception when insufficient_privilege then
    null;
  end;

  -- 1.8 Unicité du numéro de répertoire dans l'organisation.
  begin
    insert into public.objets (organisation_id, numero_repertoire) values (org_a, '2026-001');
    raise exception 'ECHEC : doublon de numéro de répertoire accepté';
  exception when unique_violation then
    null;
  end;

  -- 1.9 L'admin modifie les coordonnées de son étude, pas les colonnes protégées.
  update public.organisations set telephone = '00 00 00 00 99' where id = org_a;
  get diagnostics n = row_count;
  assert n = 1, 'ECHEC : l''admin A doit pouvoir modifier son organisation';
  begin
    update public.organisations set slug = 'autre-slug' where id = org_a;
    raise exception 'ECHEC : le slug est modifiable par le client';
  exception when insufficient_privilege then
    null;
  end;

  -- 1.10 Fichier sous son propre préfixe : accepté.
  insert into storage.objects (bucket_id, name) values ('objet-photos', org_a::text || '/photo-test.jpg');

  raise notice 'Scénario A contre B : OK';
end
$$;

reset role;


-- -----------------------------------------------------------------------------
-- 2. Utilisateur A2 (membre de A) : son propre profil, et rien de plus
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

do $$
declare
  org_a uuid := current_setting('test.org_a')::uuid;
  org_b uuid := current_setting('test.org_b')::uuid;
  u_a   uuid := '11111111-1111-4111-8111-111111111111';
  u_a2  uuid := '33333333-3333-4333-8333-333333333333';
  n bigint;
begin
  -- Lit les membres de son organisation (A, A2 et V), pas ceux de B ni des autres.
  select count(*) into n from public.profiles;
  assert n = 3, format('ECHEC : A2 doit voir 3 profils (A, V et lui), en voit %s', n);

  -- Modifie son nom et sa qualité.
  update public.profiles set full_name = 'Membre A2 renommé', qualite = 'Clerc' where id = u_a2;
  get diagnostics n = row_count;
  assert n = 1, 'ECHEC : A2 doit pouvoir modifier son propre profil';

  -- Ne modifie pas le profil d'un autre membre.
  update public.profiles set full_name = 'Piraté' where id = u_a;
  get diagnostics n = row_count;
  assert n = 0, 'ECHEC : A2 a modifié le profil de A';

  -- Ne change ni son rôle ni son organisation.
  begin
    update public.profiles set role = 'admin' where id = u_a2;
    raise exception 'ECHEC : A2 a pu changer son rôle';
  exception when insufficient_privilege then
    null;
  end;
  begin
    update public.profiles set organisation_id = org_b where id = u_a2;
    raise exception 'ECHEC : A2 a pu changer son organisation';
  exception when insufficient_privilege then
    null;
  end;
  assert (select role = 'member' and organisation_id = org_a from public.profiles where id = u_a2),
    'ECHEC : le rôle ou l''organisation de A2 a changé';

  -- Membre non admin : ni mise à jour de l'étude, ni invitations.
  update public.organisations set name = 'Renommée par un membre' where id = org_a;
  get diagnostics n = row_count;
  assert n = 0, 'ECHEC : un membre non admin a modifié l''organisation';
  select count(*) into n from public.invitations;
  assert n = 0, 'ECHEC : un membre non admin voit les invitations';
  begin
    insert into public.invitations (organisation_id, email, invited_by) values (org_a, 'v@marto.test', auth.uid());
    raise exception 'ECHEC : un membre non admin a créé une invitation';
  exception when insufficient_privilege then
    null;
  end;

  -- Mais accède aux données métier de son organisation.
  select count(*) into n from public.dossiers where organisation_id = org_a;
  assert n > 0, 'ECHEC : A2 ne voit pas les dossiers de son organisation';

  raise notice 'Scénario membre A2 : OK';
end
$$;

reset role;


-- -----------------------------------------------------------------------------
-- 3. Utilisateur B : symétrie (ne voit rien de A)
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

do $$
declare
  org_a uuid := current_setting('test.org_a')::uuid;
  t text; n bigint;
begin
  foreach t in array array['profiles', 'invitations', 'ventes', 'dossiers', 'objets', 'vehicule_docs',
                           'dossier_lieux', 'dossier_contrats', 'checklist_items', 'courriers', 'activity_log'] loop
    execute format('select count(*) from public.%I where organisation_id = $1', t) into n using org_a;
    assert n = 0, format('ECHEC lecture : B voit %s ligne(s) de A dans %s', n, t);
  end loop;
  raise notice 'Scénario B contre A : OK';
end
$$;

reset role;


-- -----------------------------------------------------------------------------
-- 4. Visiteur non connecté (anon) : aucun accès aux tables métier
-- -----------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

do $$
declare
  t text; n bigint;
begin
  foreach t in array array['organisations', 'profiles', 'invitations', 'ventes', 'dossiers', 'objets',
                           'vehicule_docs', 'dossier_lieux', 'dossier_contrats', 'checklist_items',
                           'courriers', 'activity_log', 'compteurs'] loop
    begin
      execute format('select count(*) from public.%I', t) into n;
    exception when insufficient_privilege then
      n := 0;
    end;
    assert n = 0, format('ECHEC : anon lit %s ligne(s) de %s', n, t);
  end loop;
  begin
    perform public.next_facture_reference(current_setting('test.org_a')::uuid, 2026);
    raise exception 'ECHEC : anon peut appeler next_facture_reference';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'Scénario anon : OK';
end
$$;

reset role;

do $$ begin raise notice 'TOUS LES TESTS RLS SONT PASSÉS'; end $$;

rollback;
