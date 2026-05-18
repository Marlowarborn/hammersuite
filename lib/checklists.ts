import type { SupabaseClient } from "@supabase/supabase-js";

export type ChecklistKind = "judiciaire" | "volontaire";

export type PhaseDef = {
  id: string;
  label: string;
  items: string[];
};

export const PHASES_JUDICIAIRE: PhaseDef[] = [
  {
    id: "ouverture",
    label: "Ouverture",
    items: [
      "Créer la référence Securigreffe",
      "Contacter le gérant",
      "Prendre RDV inventaire",
      "Signer la déclaration sur l'honneur",
    ],
  },
  {
    id: "contact_gerant",
    label: "Contact gérant",
    items: [
      "Demander contrats de location",
      "Demander contrats de leasing",
      "Demander contrats de dépôt / CG",
      "Identifier les lieux multiples de stockage",
      "Vérifier assujettissement TVA",
    ],
  },
  {
    id: "inventaire",
    label: "Inventaire",
    items: [
      "Photographier les biens",
      "Lister par rubrique (matériel / mobilier / véhicule…)",
      "Valeurs d'exploitation renseignées",
      "Valeurs de reprise renseignées",
      "Documents véhicule (non-gage, CG, FIV, CT…)",
    ],
  },
  {
    id: "preparation_vente",
    label: "Préparation vente",
    items: [
      "Programmer la date de vente",
      "Publicité Moniteur",
      "Publication Interencheres",
      "Préparer le dossier facture / frais",
      "Prévenir gérant et mandataire",
    ],
  },
  {
    id: "vente",
    label: "Vente",
    items: [
      "Matériel jour J (ordi, imprimante, cahier OA, marteau, papier, CR)",
      "Enregistrement des acheteurs sur place",
      "Vérification des identités",
      "Bordereaux d'achat émis",
      "Coordonnées et dates d'enlèvement collectées",
    ],
  },
  {
    id: "restitution",
    label: "Restitution",
    items: [
      "Biens en leasing restitués",
      "Biens en location restitués",
      "Enlèvement effectué",
    ],
  },
  {
    id: "cloture",
    label: "Clôture",
    items: [
      "Décompte mandataire envoyé",
      "Virements / chèques émis",
      "Archivage du dossier",
    ],
  },
];

export const PHASES_VOLONTAIRE: PhaseDef[] = [
  {
    id: "mandat",
    label: "Mandat",
    items: [
      "Qualité vendeur définie (succession / indivision / perso / pro)",
      "Mandat signé",
      "Documents de provenance reçus",
      "Frais convenus",
    ],
  },
  {
    id: "seance_photo",
    label: "Séance photo",
    items: [
      "Photos principales OK",
      "Photos complémentaires (dos / signature / détail / cadre)",
      "Infos manquantes résolues",
    ],
  },
  {
    id: "preparation",
    label: "Préparation",
    items: [
      "Copyright photos validé",
      "Certificats reçus",
      "Ordre de vente figé",
      "Lots phares désignés",
      "Catalogue rédigé",
      "Publicité Gazette / Moniteur",
    ],
  },
  {
    id: "vente",
    label: "Vente",
    items: [
      "Catalogues envoyés (vendeurs + intéressés)",
      "Vendeur prévenu",
      "Plan de salle prêt",
      "Matériel jour J",
    ],
  },
  {
    id: "post_vente",
    label: "Post-vente",
    items: [
      "Bordereaux d'achat envoyés",
      "Lots répartis (étude / magasinage / réserve / coffre)",
    ],
  },
  {
    id: "decompte",
    label: "Décompte",
    items: [
      "Frais calculés (FV, expert, transport, magasinage…)",
      "Droit de suite calculé",
      "Maison des Artistes calculée",
      "Virement émis",
      "Preuve de règlement archivée",
    ],
  },
];

export function getPhases(kind: ChecklistKind): PhaseDef[] {
  return kind === "judiciaire" ? PHASES_JUDICIAIRE : PHASES_VOLONTAIRE;
}

export type SeedTarget =
  | { kind: ChecklistKind; dossierId: string; venteId?: undefined }
  | { kind: ChecklistKind; venteId: string; dossierId?: undefined };

type SupabaseClientAny = SupabaseClient | ReturnType<typeof import("@supabase/ssr").createBrowserClient>;

export async function seedChecklist(
  supabase: SupabaseClientAny,
  organisationId: string,
  target: SeedTarget,
): Promise<void> {
  const phases = getPhases(target.kind);
  const rows = phases.flatMap((phase, phaseIndex) =>
    phase.items.map((label, itemIndex) => ({
      organisation_id: organisationId,
      dossier_id: target.dossierId ?? null,
      vente_id: target.venteId ?? null,
      phase: phase.id,
      label,
      ordre: phaseIndex * 100 + itemIndex,
      is_done: false,
    })),
  );
  if (rows.length === 0) return;
  await supabase.from("checklist_items").insert(rows);
}
