export const RUBRIQUE_LABELS: Record<string, string> = {
  materiel: "Matériel",
  mobilier: "Mobilier",
  vehicule: "Véhicule",
  stock: "Stock",
  leasing: "Leasing",
  location: "Location",
  depot: "Dépôt",
};

export const CONTRAT_TYPE_LABELS: Record<string, string> = {
  location: "Location",
  leasing: "Leasing",
  depot: "Dépôt",
  cg: "Conditions générales",
  autre: "Autre",
};

export const COURRIER_TYPES = [
  "ordonnance",
  "requete",
  "der",
  "note_honoraires",
  "courrier_envoi",
  "inventaire_judiciaire",
] as const;

export type CourrierType = (typeof COURRIER_TYPES)[number];

export const COURRIER_TYPE_META: Record<CourrierType, { label: string; subtitle: string }> = {
  ordonnance: { label: "Ordonnance", subtitle: "Saisine du juge commissaire" },
  requete: { label: "Requête", subtitle: "Vente aux enchères publiques" },
  der: { label: "DER", subtitle: "Demande d'évaluation de rémunération" },
  note_honoraires: { label: "Note d'honoraires", subtitle: "Facturation des prestations" },
  courrier_envoi: { label: "Courrier d'envoi", subtitle: "Communication intervenant" },
  inventaire_judiciaire: { label: "Inventaire judiciaire", subtitle: "Liste complète des biens" },
};

export const DESTINATAIRES = [
  { value: "juge_commissaire", label: "Juge commissaire" },
  { value: "mandataire", label: "Mandataire judiciaire" },
  { value: "administrateur", label: "Administrateur judiciaire" },
  { value: "greffe", label: "Greffe" },
  { value: "gerant", label: "Gérant" },
] as const;

export type DestinataireValue = (typeof DESTINATAIRES)[number]["value"];

export const DESTINATAIRE_LABELS: Record<string, string> = Object.fromEntries(
  DESTINATAIRES.map((d) => [d.value, d.label]),
);
