# Modèle métier encodé dans Marto.io

> Généré par `npm run docs:metier` à partir du code. Ne pas modifier à la main : corriger le code,
> puis régénérer. À relire par une personne du métier ; les points douteux sont en fin de page.

## Dossier judiciaire

Natures de procédure proposées : Liquidation Judiciaire, Redressement Judiciaire, Sauvegarde, Cession d'actifs, Vente judiciaire diverse.

| Champ du formulaire | Colonne |
|---|---|
| N° Dossier (obligatoire) | `numero` |
| Nature (obligatoire) | `nature` |
| Date d'ouverture | `date_ouverture` |
| Date de vente prévue | `date_vente` |
| Nom / Raison sociale (obligatoire) | `debiteur_nom` |
| Forme juridique | `debiteur_forme_juridique` |
| Adresse | `debiteur_adresse` |
| Code postal | `debiteur_code_postal` |
| Ville | `debiteur_ville` |
| Tribunal | `tribunal` |
| N° greffe | `numero_greffe` |
| Date jugement | `date_jugement` |
| ID Securigreffe | `securigreffe_id` |
| Décret | `decret` |
| Juge commissaire | `juge_commissaire` |
| Adresse juge commissaire | `juge_commissaire_adresse` |
| Mandataire judiciaire | `mandataire` |
| Adresse mandataire | `mandataire_adresse` |
| Administrateur | `administrateur` |
| Adresse administrateur | `administrateur_adresse` |
| Adresse du greffe | `greffe_adresse` |
| Nom du gérant | `gerant_nom` |
| Téléphone | `gerant_telephone` |
| Email | `gerant_email` |
| Adresse | `gerant_adresse` |
| Conseil | `conseil_nom` |
| Autres membres | `autres_membres` |
| Correspondant | `correspondant` |
| Email correspondant | `correspondant_email` |
| Signataire | `signataire` |
| Collaborateur | `collaborateur` |

Plus : société assujettie à la TVA (case), déclaration sur l'honneur (case et fichier), commentaires, statut (en cours, suspendu, clôturé), phase.

## Objets (répertoire et inventaire)

- Types d'entrée : volontaire, judiciaire, dépôt.
- Statuts : en attente, attribué, vendu, invendu, restitué.
- Rubriques : Matériel, Mobilier, Véhicule, Stock, Leasing, Location, Dépôt.
- Valeurs : valeur d'exploitation, valeur de reprise, estimation basse et haute.
- Documents véhicule : non-gage, carte grise, FIV, contrôle technique, certificat de vente, certificat de cession.
- Numéro de répertoire `AAAA-NNN`, attribué par la base (compteur par étude et par année).

## Annexes du dossier

- Contrats : Location, Leasing, Dépôt, Conditions générales, Autre (avec date « restituer avant » et fichier).
- Lieux de stockage : adresse, contact, téléphone, notes.

## Checklists

### Judiciaire (7 phases, 30 points)

1. **Ouverture**
   - Créer la référence Securigreffe
   - Contacter le gérant
   - Prendre RDV inventaire
   - Signer la déclaration sur l'honneur
2. **Contact gérant**
   - Demander contrats de location
   - Demander contrats de leasing
   - Demander contrats de dépôt / CG
   - Identifier les lieux multiples de stockage
   - Vérifier assujettissement TVA
3. **Inventaire**
   - Photographier les biens
   - Lister par rubrique (matériel / mobilier / véhicule…)
   - Valeurs d'exploitation renseignées
   - Valeurs de reprise renseignées
   - Documents véhicule (non-gage, CG, FIV, CT…)
4. **Préparation vente**
   - Programmer la date de vente
   - Publicité Moniteur
   - Publication Interencheres
   - Préparer le dossier facture / frais
   - Prévenir gérant et mandataire
5. **Vente**
   - Matériel jour J (ordi, imprimante, cahier OA, marteau, papier, CR)
   - Enregistrement des acheteurs sur place
   - Vérification des identités
   - Bordereaux d'achat émis
   - Coordonnées et dates d'enlèvement collectées
6. **Restitution**
   - Biens en leasing restitués
   - Biens en location restitués
   - Enlèvement effectué
7. **Clôture**
   - Décompte mandataire envoyé
   - Virements / chèques émis
   - Archivage du dossier

### Volontaire (6 phases, 24 points)

1. **Mandat**
   - Qualité vendeur définie (succession / indivision / perso / pro)
   - Mandat signé
   - Documents de provenance reçus
   - Frais convenus
2. **Séance photo**
   - Photos principales OK
   - Photos complémentaires (dos / signature / détail / cadre)
   - Infos manquantes résolues
3. **Préparation**
   - Copyright photos validé
   - Certificats reçus
   - Ordre de vente figé
   - Lots phares désignés
   - Catalogue rédigé
   - Publicité Gazette / Moniteur
4. **Vente**
   - Catalogues envoyés (vendeurs + intéressés)
   - Vendeur prévenu
   - Plan de salle prêt
   - Matériel jour J
5. **Post-vente**
   - Bordereaux d'achat envoyés
   - Lots répartis (étude / magasinage / réserve / coffre)
6. **Décompte**
   - Frais calculés (FV, expert, transport, magasinage…)
   - Droit de suite calculé
   - Maison des Artistes calculée
   - Virement émis
   - Preuve de règlement archivée

## Courriers et actes

| Type | Libellé | Précision |
|---|---|---|
| `ordonnance` | Ordonnance | Saisine du juge commissaire |
| `requete` | Requête | Vente aux enchères publiques |
| `der` | DER | Demande d'évaluation de rémunération |
| `note_honoraires` | Note d'honoraires | Facturation des prestations |
| `courrier_envoi` | Courrier d'envoi | Communication intervenant |
| `inventaire_judiciaire` | Inventaire judiciaire | Liste complète des biens |

Destinataires possibles du courrier d'envoi : Juge commissaire, Mandataire judiciaire, Administrateur judiciaire, Greffe, Gérant.

Chaque courrier reçoit un socle commun (étude avec SIRET, IBAN et TVA intracommunautaire, signataire,
dossier, débiteur, tribunal, intervenants, gérant, correspondants, déclaration sur l'honneur). La note
d'honoraires porte un numéro `NH-AAAA-NNN` réservé en base avant la génération (pas de trou de
numérotation) ; le DER et l'inventaire judiciaire reçoivent l'inventaire chiffré par rubrique.
Les textes des modèles vivent sur PDFMonkey, hors du dépôt.

## Points à valider par une personne du métier

1. L'ordonnance est présentée comme la « saisine » du juge-commissaire et générée sans liste de biens ni modalités de vente.
2. « DER, demande d'évaluation de rémunération » : à quel acte réel cela correspond-il ?
3. « Valeur de reprise » contre valeur de réalisation ou de liquidation ; estimations basse et haute dans un inventaire judiciaire.
4. Une seule rubrique mélange la nature du bien et son titre (leasing, location, dépôt) ; pas de réserve de propriété ni de revendication.
5. Note d'honoraires à montant libre et TVA à 20 %, alors que le judiciaire est tarifé en émoluments et que la TVA dépend de l'assujettissement.
6. Le répertoire peut-il tenir lieu de livre de police ou de répertoire des procès-verbaux (identité du vendeur, prix, date non modifiable) ?
7. Manquent saisie-vente, liquidation simplifiée, succession vacante, SIREN du débiteur, mission confiée, date d'inventaire.
8. La checklist judiciaire n'a ni requête, ni ordonnance, ni dépôt de l'inventaire, ni procès-verbal de vente ; qui signe la déclaration sur l'honneur ?
