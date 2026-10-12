# Schéma Supabase de Marto.io

Reconstitué depuis le code (branche `reprise/phase-0`) : 62 appels `.from()`, 11 tables, 3 buckets. Validé hors ligne (Postgres 17 via PGlite, bouchon `auth` et `storage`) : migrations rejouées deux fois, seed, `tests_rls.sql` vert.

## Appliquer

1. `supabase/migrations/` : `0001_schema.sql`, `0002_rls.sql` (l.ancienne migration `20260518_step7_courriers.sql` est reprise dans 0001 et supprimée).
2. `supabase db push`, ou SQL Editor dans l'ordre 0001 puis 0002.
3. En local seulement : `supabase/seed.sql` (`supabase db reset` le joue). Jamais dans `migrations/`.
4. Tests : `npm run test:sql` (Postgres embarqué PGlite, aucun service) ou `psql ... -f supabase/tests/rls.sql` sur une base locale.
5. Auth : garder « Confirm email » activé (sinon on peut s'inscrire avec l'email d'un invité).

## Ce que suppose chaque fichier

- **0001** : projet Supabase, Postgres 15+. Tables, contraintes, index, `updated_at`, numérotation atomique (`compteurs` + `next_numero_repertoire`, `reserver_numeros_repertoire`, `next_facture_reference`).
- **0002** : 0001. RLS « même organisation », droits par colonne, garde sur `profiles`, trigger `handle_new_user`, 3 buckets privés rangés par `<organisation_id>/...`.
- **0003** : 0001 et 0002 (le trigger crée « Étude de démonstration »).
- **tests_rls.sql** : base locale vierge, exécution en `postgres`.

## Ajouts par rapport au code

- `organisations.numero_tva_intracom` (mention de facture).
- `objets.genere_par_ia`, `objets.photo_path`.
- `courriers.pdf_path`, `dossiers.declaration_honneur_path`, `dossier_contrats.fichier_path`, `checklist_items.doc_path` : chemins storage à la place d'URL signées qui expirent.
- `updated_at` partout (sauf `activity_log`), `created_at` là où le code ne le lit pas.
- Tables `invitations` et `compteurs` ; fonctions `auth_est_admin`, `slugifier`, `reserver_numeros_repertoire`.
- Contraintes : slug unique, clés étrangères composites (un enfant reste dans l'organisation de son parent), anti-doublon de checklist.

## Écarts assumés à la consigne

- `activity_log` : lecture et ajout seulement.
- `courriers` : suppression interdite si `reference` est renseignée (facture émise).
- `invitations` : réservée aux admins, pas de modification.
- `handle_new_user` lit aussi la clé `organisation_id` (celle qu'envoie le code actuel), mais exige toujours une invitation en base.

## Le code devra changer

1. **Inscription** : ne plus insérer `organisations` ni modifier `profiles` (refusé désormais) ; passer `organisation_name` dans `signUp({ options: { data } })`.
2. **Invitation** : insérer la ligne `invitations`, puis `signInWithOtp` avec `data: { invitation_org_id }`. Un compte déjà existant n'est pas rattaché (un utilisateur, une organisation).
3. **Numérotation** : `rpc("next_numero_repertoire")` dans saisie, lots et `ObjetJudiciaireForm` ; `rpc("reserver_numeros_repertoire")` pour l'import ; `rpc("next_facture_reference")` à la place de `nextFactureReference`. Les calculs max+1 heurteront désormais la contrainte d'unicité.
4. **Factures sans trou** : un numéro consommé n'est pas rendu. Créer le courrier en `draft` avec sa référence avant l'appel PDFMonkey, puis passer en `generated` ; en cas d'échec, régénérer sur le même brouillon.
5. **PDF archivé** : télécharger le PDF PDFMonkey dans `dossier-docs/<org>/<dossier>/courriers/<id>.pdf`, renseigner `pdf_path` ; `refresh-url` signe depuis le storage.
6. **Photos privées** : `getPublicUrl` ne marche plus. Stocker `photo_path`, signer à l'affichage et dans le payload PDFMonkey (DER, inventaire). Idem pour les autres `*_path` ; `vehicule_docs` : stocker le chemin dans les `*_url`.
7. `genere_par_ia = true` quand `/api/analyze-photo` a rempli la fiche ; `numero_tva_intracom` dans les paramètres et le bloc `etude`.
8. `DossierForm` : envoyer `null` si `date_ouverture` est vide (sinon erreur de type date).

## Incertitudes

- Types devinés : `ventes.estimate` (text), `ventes.lots` (integer), montants en `numeric(12,2)` (le code fait `parseInt`), `activity_log.entity_id` (uuid), `objets.numero_lot` (text), `prix_adjudication` (numeric). Ces trois dernières colonnes sont lues mais jamais écrites.
- `profiles.role` : la valeur `user` (affichée comme membre) est exclue.
- `dossiers.nature` laissée libre ; les CHECK de `phase` copient `lib/checklists.ts` (une nouvelle phase exige une migration).
- `vehicule_docs`, jamais relue : pas d'unicité par objet.
- Storage testé sur un bouchon : vérifier les politiques sur un vrai `supabase start` (triggers internes selon la version).
