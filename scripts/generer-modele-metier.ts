// Génère docs/modele-metier.md à partir du code : la référence lisible du modèle métier,
// à faire valider par une personne du métier (Léa) avant toute évolution.
//
//   npm run docs:metier
//
// Sources : lib/checklists.ts, lib/labels.ts, components/app/DossierForm.tsx.
// Node 22.6+ (types TypeScript retirés à la volée).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASES_JUDICIAIRE, PHASES_VOLONTAIRE, type PhaseDef } from "../lib/checklists.ts";
import {
  RUBRIQUE_LABELS,
  CONTRAT_TYPE_LABELS,
  COURRIER_TYPE_META,
  DESTINATAIRES,
} from "../lib/labels.ts";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const formulaire = readFileSync(join(racine, "components/app/DossierForm.tsx"), "utf8");

// Champs du dossier : chaque <Input label="..." ... f("cle", ...)> ou <Select label="..." ... f("cle", ...)>.
const champs: { label: string; cle: string }[] = [];
for (const m of formulaire.matchAll(/<(?:Input|Select)\s+label="([^"]+)"(?:(?!<(?:Input|Select)\s)[\s\S])*?f\("(\w+)"/g)) {
  champs.push({ label: m[1].replace(/\s*\*$/, " (obligatoire)"), cle: m[2] });
}
const natures = [...(formulaire.match(/const NATURES = \[([\s\S]*?)\];/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const checklist = (titre: string, phases: PhaseDef[]) => [
  `### ${titre} (${phases.length} phases, ${phases.reduce((n, p) => n + p.items.length, 0)} points)`,
  "",
  ...phases.flatMap((p, i) => [`${i + 1}. **${p.label}**`, ...p.items.map((it) => `   - ${it}`)]),
  "",
];

const lignes = [
  "# Modèle métier encodé dans Marto.io",
  "",
  "> Généré par `npm run docs:metier` à partir du code. Ne pas modifier à la main : corriger le code,",
  "> puis régénérer. À relire par une personne du métier ; les points douteux sont en fin de page.",
  "",
  "## Dossier judiciaire",
  "",
  `Natures de procédure proposées : ${natures.join(", ")}.`,
  "",
  "| Champ du formulaire | Colonne |",
  "|---|---|",
  ...champs.map((c) => `| ${c.label} | \`${c.cle}\` |`),
  "",
  "Plus : société assujettie à la TVA (case), déclaration sur l'honneur (case et fichier), commentaires, statut (en cours, suspendu, clôturé), phase.",
  "",
  "## Objets (répertoire et inventaire)",
  "",
  "- Types d'entrée : volontaire, judiciaire, dépôt.",
  "- Statuts : en attente, attribué, vendu, invendu, restitué.",
  `- Rubriques : ${Object.values(RUBRIQUE_LABELS).join(", ")}.`,
  "- Valeurs : valeur d'exploitation, valeur de reprise, estimation basse et haute.",
  "- Documents véhicule : non-gage, carte grise, FIV, contrôle technique, certificat de vente, certificat de cession.",
  "- Numéro de répertoire `AAAA-NNN`, attribué par la base (compteur par étude et par année).",
  "",
  "## Annexes du dossier",
  "",
  `- Contrats : ${Object.values(CONTRAT_TYPE_LABELS).join(", ")} (avec date « restituer avant » et fichier).`,
  "- Lieux de stockage : adresse, contact, téléphone, notes.",
  "",
  "## Checklists",
  "",
  ...checklist("Judiciaire", PHASES_JUDICIAIRE),
  ...checklist("Volontaire", PHASES_VOLONTAIRE),
  "## Courriers et actes",
  "",
  "| Type | Libellé | Précision |",
  "|---|---|---|",
  ...Object.entries(COURRIER_TYPE_META).map(([k, v]) => `| \`${k}\` | ${v.label} | ${v.subtitle} |`),
  "",
  `Destinataires possibles du courrier d'envoi : ${DESTINATAIRES.map((d) => d.label).join(", ")}.`,
  "",
  "Chaque courrier reçoit un socle commun (étude avec SIRET, IBAN et TVA intracommunautaire, signataire,",
  "dossier, débiteur, tribunal, intervenants, gérant, correspondants, déclaration sur l'honneur). La note",
  "d'honoraires porte un numéro `NH-AAAA-NNN` réservé en base avant la génération (pas de trou de",
  "numérotation) ; le DER et l'inventaire judiciaire reçoivent l'inventaire chiffré par rubrique.",
  "Les textes des modèles vivent sur PDFMonkey, hors du dépôt.",
  "",
  "## Points à valider par une personne du métier",
  "",
  "1. L'ordonnance est présentée comme la « saisine » du juge-commissaire et générée sans liste de biens ni modalités de vente.",
  "2. « DER, demande d'évaluation de rémunération » : à quel acte réel cela correspond-il ?",
  "3. « Valeur de reprise » contre valeur de réalisation ou de liquidation ; estimations basse et haute dans un inventaire judiciaire.",
  "4. Une seule rubrique mélange la nature du bien et son titre (leasing, location, dépôt) ; pas de réserve de propriété ni de revendication.",
  "5. Note d'honoraires à montant libre et TVA à 20 %, alors que le judiciaire est tarifé en émoluments et que la TVA dépend de l'assujettissement.",
  "6. Le répertoire peut-il tenir lieu de livre de police ou de répertoire des procès-verbaux (identité du vendeur, prix, date non modifiable) ?",
  "7. Manquent saisie-vente, liquidation simplifiée, succession vacante, SIREN du débiteur, mission confiée, date d'inventaire.",
  "8. La checklist judiciaire n'a ni requête, ni ordonnance, ni dépôt de l'inventaire, ni procès-verbal de vente ; qui signe la déclaration sur l'honneur ?",
  "",
];

mkdirSync(join(racine, "docs"), { recursive: true });
writeFileSync(join(racine, "docs/modele-metier.md"), lignes.join("\n"));
console.log(`docs/modele-metier.md : ${champs.length} champs de dossier, ${natures.length} natures, ${PHASES_JUDICIAIRE.length + PHASES_VOLONTAIRE.length} phases.`);
