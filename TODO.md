# TODO

Petites dettes signalées au fil de l'eau, à reprendre quand le scope le permet.

## UI — Dossiers

- `app/dashboard/dossiers/page.tsx:241-248` — sur le panneau latéral du dossier sélectionné, les boutons **"Voir les objets"** et **"Modifier"** n'ont pas d'`onClick`. Inertes en l'état.
  - "Voir les objets" devrait probablement router vers `/dashboard/dossiers/[id]` sur l'onglet Objets.
  - "Modifier" devrait ouvrir un modal d'édition (réutiliser/refactorer le modal de création).

## Bugs prod à investiguer

- **Signup `/signup` étape "Créer mon espace" — `Failed to fetch` en prod (hammersuite-kk8d.vercel.app).** À investiguer après l'étape 2 (système de design). Pistes : (a) env vars Supabase manquantes côté Vercel ; (b) RLS sur `organisations` / `profiles` qui bloque l'insertion à l'inscription (pas de session active au moment de créer la première ligne) ; (c) CORS / config redirect URLs Supabase Auth. À reproduire en ouvrant la console réseau pour voir l'URL ciblée par le fetch qui échoue.
