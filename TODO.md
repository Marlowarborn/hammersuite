# TODO

Petites dettes signalées au fil de l'eau, à reprendre quand le scope le permet.

## UI — Dossiers

- `app/dashboard/dossiers/page.tsx:241-248` — sur le panneau latéral du dossier sélectionné, les boutons **"Voir les objets"** et **"Modifier"** n'ont pas d'`onClick`. Inertes en l'état.
  - "Voir les objets" devrait probablement router vers `/dashboard/dossiers/[id]` sur l'onglet Objets.
  - "Modifier" devrait ouvrir un modal d'édition (réutiliser/refactorer le modal de création).
