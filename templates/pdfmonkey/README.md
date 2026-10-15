# Modèles PDFMonkey

Les six actes produits par `app/api/generate-courrier/route.ts` sont rendus par PDFMonkey
(compte de Malo, moteur v5). Ce dossier est la copie versionnée de ce qui est publié chez
PDFMonkey : **modifier ici, puis recopier dans l'éditeur PDFMonkey et publier.** Les variables
Liquid (`{{ etude.nom }}`, `{{ dossier.numero }}`…) viennent de `lib/courrier-payload.ts`.

| Acte | Fichier | Identifiant du modèle (variable d'environnement) |
|---|---|---|
| Ordonnance | `ordonnance.html` | `PDFMONKEY_TEMPLATE_ORDONNANCE` = cc049a6e-b398-4541-baed-c060f1843335 |
| Requête | `requete.html` | `PDFMONKEY_TEMPLATE_REQUETE` = 2c4cf98c-bbc6-4ef3-a24d-288901259024 |
| DER | `der.html` | `PDFMONKEY_TEMPLATE_DER` = ecb9e35a-58d6-4025-a307-11105d23f786 |
| Note d'honoraires | `note_honoraires.html` | `PDFMONKEY_TEMPLATE_NOTE_HONORAIRES` = 2290c40f-4db5-4388-ad50-cf0d1f65e5af |
| Courrier d'envoi | `courrier_envoi.html` | `PDFMONKEY_TEMPLATE_COURRIER_ENVOI` = 9bd887ab-8781-4001-a491-8abad8e55887 |
| Inventaire judiciaire | `inventaire_judiciaire.html` | `PDFMONKEY_TEMPLATE_INVENTAIRE_JUDICIAIRE` = ec685c51-785a-4a35-a4be-9e2327b6d400 |

Les identifiants ne sont pas secrets (ils figurent dans l'URL de l'éditeur) ; la clé API, elle,
reste dans Vercel.

## Contrainte du plan gratuit (décision Malo, 15/10/2026)

Le plan gratuit de PDFMonkey refuse toute ressource externe (polices, CSS, JS, images chargées
depuis une URL) et limite à 20 documents par mois. Les modèles de ce dossier sont donc la
version **allégée** : l'import des polices Google (Cormorant, DM Sans) est retiré, le rendu se
fait avec les polices de secours (serif, sans-serif), et l'inventaire judiciaire n'affiche plus
les photos des objets. Les versions d'origine du 9 juillet 2026, avec polices et photos, sont
dans `originaux-2026-07-09/` : elles redeviennent utilisables avec un plan Starter (5 €/mois,
300 documents, tarif de septembre 2026) ou si les PDF sont un jour produits dans l'application.

Un modèle « Catalogues Ventes » existe aussi chez PDFMonkey ; il n'est appelé par aucun code.
