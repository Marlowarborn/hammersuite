# Marto.io (dépôt `hammersuite`)

Logiciel de gestion pour commissaires de justice et maisons de vente : répertoire d'objets,
dossiers judiciaires avec checklist par phase, courriers et actes, saisie d'objets par photo.
Version de travail, sans client en production. Construit avec des études pilotes.

## État (octobre 2026)

| Module | État |
|---|---|
| Comptes, étude, membres (`/dashboard/settings`) | fonctionnel |
| Répertoire d'objets, import IA de documents (`/dashboard/lots`) | fonctionnel |
| Saisie par photo (`/saisie`) | fonctionnel, la photo n'est pas encore conservée |
| Dossiers judiciaires, lieux, contrats, checklists (`/dashboard/dossiers`) | fonctionnel |
| Courriers PDF via PDFMonkey | fonctionnel, PDF non archivé (prévu : stockage dans Supabase) |
| Ventes (`/dashboard/sales`) | création simple |
| Catalogues, clients, estimations, analytiques | en préparation (pages d'attente) |

Le projet Supabase d'origine n'est plus joignable. Le schéma est reconstruit et versionné dans
`supabase/migrations/` : un nouveau projet se crée à partir de ces fichiers.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Supabase (auth, Postgres, storage),
Anthropic (extraction et analyse photo), PDFMonkey (génération des courriers), Vercel.

## Démarrer

```bash
npm ci
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

Variables d'environnement : voir `.env.example`. Sans les deux variables Supabase, le build échoue
au prérendu ; avec des valeurs factices, il passe (c'est ce que fait la CI).

## Vérifier

```bash
npx tsc --noEmit
npx eslint .
npx next build
```

La CI GitHub Actions (`.github/workflows/ci.yml`) exécute ces trois commandes.

## Structure

- `app/` : pages (App Router) et routes API (`app/api/*`).
- `components/app/` : composants métier (dossier, objet, courriers, checklist).
- `components/ui/` : kit d'interface.
- `lib/checklists.ts`, `lib/labels.ts`, `lib/courrier-payload.ts` : le métier encodé (phases,
  rubriques, variables des courriers). À faire relire par un praticien avant toute évolution.
- `lib/auth.ts` : garde d'authentification des routes API et limites d'upload.
- `supabase/migrations/` : schéma, règles RLS, triggers, buckets.

## Règles

- Aucune route API sans `requireSession()` ; toute lecture filtrée par `organisation_id`.
- Aucun secret dans le dépôt ; les clés vivent dans `.env.local` et dans Vercel.
- Les contenus générés par IA sont signalés (`genere_par_ia`), obligation depuis août 2026.
- Pas de données réelles dans les exemples, les placeholders ni les tests.
