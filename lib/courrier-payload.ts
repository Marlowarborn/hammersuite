import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RUBRIQUE_LABELS,
  CONTRAT_TYPE_LABELS,
  DESTINATAIRE_LABELS,
  type CourrierType,
  type DestinataireValue,
} from "@/lib/labels";

type Dossier = Record<string, unknown> & {
  id: string;
  organisation_id: string;
  numero?: string | null;
  nature?: string | null;
  phase?: string | null;
  statut?: string | null;
  date_ouverture?: string | null;
  date_vente?: string | null;
  date_jugement?: string | null;
  decret?: string | null;
  securigreffe_id?: string | null;
  commentaires?: string | null;
  debiteur_nom?: string | null;
  debiteur_forme_juridique?: string | null;
  debiteur_adresse?: string | null;
  debiteur_code_postal?: string | null;
  debiteur_ville?: string | null;
  tribunal?: string | null;
  numero_greffe?: string | null;
  greffe_adresse?: string | null;
  juge_commissaire?: string | null;
  juge_commissaire_adresse?: string | null;
  mandataire?: string | null;
  mandataire_adresse?: string | null;
  administrateur?: string | null;
  administrateur_adresse?: string | null;
  gerant_nom?: string | null;
  gerant_adresse?: string | null;
  gerant_telephone?: string | null;
  gerant_email?: string | null;
  societe_assujettie_tva?: boolean | null;
  conseil_nom?: string | null;
  autres_membres?: string | null;
  correspondant?: string | null;
  correspondant_email?: string | null;
  signataire?: string | null;
  collaborateur?: string | null;
  declaration_honneur_signee?: boolean | null;
  declaration_honneur_url?: string | null;
  declaration_honneur_path?: string | null;
};

type Organisation = Record<string, unknown> & {
  id: string;
  name?: string | null;
  slug?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  siret?: string | null;
  iban?: string | null;
  numero_tva_intracom?: string | null;
};

type Profile = {
  full_name?: string | null;
  email?: string | null;
  qualite?: string | null;
};

export type CourrierOptions = {
  // requete
  objet?: string;
  corps?: string;
  // note_honoraires
  description_prestation?: string;
  montant_ht?: number | string;
  taux_tva?: number | string;
  mode_reglement?: string;
  // courrier_envoi
  piece_jointe_label?: string;
};

const s = (v: unknown): string => (v == null ? "" : String(v));

const formatDateFR = (iso: string | null | undefined): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

// Durée des liens signés transmis à PDFMonkey (secondes) : le PDF est rendu dans les
// minutes qui suivent l'appel, deux heures laissent une marge confortable.
const DUREE_LIEN_SIGNE_S = 2 * 60 * 60;

/**
 * Signe en un seul appel des chemins d'un bucket privé. Renvoie une table
 * chemin -> URL signée ; un chemin absent de la table n'a pas pu être signé et
 * l'appelant garde son repli (ancienne URL stockée).
 */
async function signerChemins(
  supabase: SupabaseClient,
  bucket: string,
  chemins: string[],
): Promise<Map<string, string>> {
  const signes = new Map<string, string>();
  const uniques = Array.from(new Set(chemins.filter((c) => c.length > 0)));
  if (uniques.length === 0) return signes;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(uniques, DUREE_LIEN_SIGNE_S);
  if (error || !data) {
    console.error("[courrier-payload] signature", bucket, error?.message);
    return signes;
  }
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) signes.set(item.path, item.signedUrl);
  }
  return signes;
}

type BuildContext = {
  dossier: Dossier;
  organisation: Organisation | null;
  profile: Profile | null;
  type: CourrierType;
  destinataire?: DestinataireValue | null;
  options?: CourrierOptions;
  numero_facture?: string;
};

export async function buildPayload(
  supabase: SupabaseClient,
  ctx: BuildContext,
): Promise<Record<string, unknown>> {
  const { dossier, organisation, profile, type, destinataire, options, numero_facture } = ctx;
  const now = new Date();
  const todayIso = now.toISOString().split("T")[0];

  const adresseComplete = [
    dossier.debiteur_adresse,
    [dossier.debiteur_code_postal, dossier.debiteur_ville].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  // Déclaration sur l'honneur : fichier du bucket privé dossier-docs, signé pour PDFMonkey.
  const declarationPath = dossier.declaration_honneur_path || "";
  const docsSignes = await signerChemins(supabase, "dossier-docs", [declarationPath]);
  const declarationUrl = docsSignes.get(declarationPath) || s(dossier.declaration_honneur_url);

  const common: Record<string, unknown> = {
    generated_at: now.toISOString(),
    date_courrier: formatDateFR(todayIso),
    date_courrier_iso: todayIso,
    lieu_emission: s(organisation?.ville) || s(organisation?.name),

    etude: {
      nom: s(organisation?.name),
      slug: s(organisation?.slug),
      adresse: s(organisation?.adresse),
      code_postal: s(organisation?.code_postal),
      ville: s(organisation?.ville),
      telephone: s(organisation?.telephone),
      email: s(organisation?.email),
      siret: s(organisation?.siret),
      iban: s(organisation?.iban),
      numero_tva_intracom: s(organisation?.numero_tva_intracom),
    },

    signataire: {
      nom_complet: s(profile?.full_name),
      email: s(profile?.email),
      qualite: s(profile?.qualite),
    },

    dossier: {
      id: dossier.id,
      numero: s(dossier.numero),
      nature: s(dossier.nature),
      phase: s(dossier.phase),
      statut: s(dossier.statut),
      date_ouverture: formatDateFR(dossier.date_ouverture),
      date_ouverture_iso: s(dossier.date_ouverture),
      date_vente: formatDateFR(dossier.date_vente),
      date_vente_iso: s(dossier.date_vente),
      date_jugement: formatDateFR(dossier.date_jugement),
      date_jugement_iso: s(dossier.date_jugement),
      decret: s(dossier.decret),
      securigreffe_id: s(dossier.securigreffe_id),
      commentaires: s(dossier.commentaires),
    },

    debiteur: {
      nom: s(dossier.debiteur_nom),
      forme_juridique: s(dossier.debiteur_forme_juridique),
      adresse: s(dossier.debiteur_adresse),
      code_postal: s(dossier.debiteur_code_postal),
      ville: s(dossier.debiteur_ville),
      adresse_complete: adresseComplete,
    },

    tribunal: {
      nom: s(dossier.tribunal),
      numero_greffe: s(dossier.numero_greffe),
      greffe_adresse: s(dossier.greffe_adresse),
    },

    juge_commissaire: {
      nom: s(dossier.juge_commissaire),
      adresse: s(dossier.juge_commissaire_adresse),
    },
    mandataire: {
      nom: s(dossier.mandataire),
      adresse: s(dossier.mandataire_adresse),
    },
    administrateur: {
      nom: s(dossier.administrateur),
      adresse: s(dossier.administrateur_adresse),
    },

    gerant: {
      nom: s(dossier.gerant_nom),
      adresse: s(dossier.gerant_adresse),
      telephone: s(dossier.gerant_telephone),
      email: s(dossier.gerant_email),
    },

    societe: {
      assujettie_tva: dossier.societe_assujettie_tva ?? false,
      conseil_nom: s(dossier.conseil_nom),
      autres_membres: s(dossier.autres_membres),
    },

    correspondants: {
      correspondant: s(dossier.correspondant),
      correspondant_email: s(dossier.correspondant_email),
      signataire: s(dossier.signataire),
      collaborateur: s(dossier.collaborateur),
    },

    declaration_honneur: {
      signee: dossier.declaration_honneur_signee ?? false,
      url: declarationUrl,
    },
  };

  const extras: Record<string, unknown> = {};

  if (type === "der" || type === "inventaire_judiciaire") {
    const { data: objetsData } = await supabase
      .from("objets")
      .select(
        "numero_repertoire,rubrique,description,titre,etat,valeur_exploitation,valeur_reprise,estimation_basse,estimation_haute,photo_url,photo_path",
      )
      .eq("dossier_id", dossier.id)
      .order("numero_repertoire", { ascending: true });

    type ObjetRow = {
      numero_repertoire: string | null;
      rubrique: string | null;
      description: string | null;
      titre: string | null;
      etat: string | null;
      valeur_exploitation: number | null;
      valeur_reprise: number | null;
      estimation_basse: number | null;
      estimation_haute: number | null;
      photo_url: string | null;
      photo_path: string | null;
    };

    const objetRows = (objetsData || []) as ObjetRow[];
    // Bucket objet-photos devenu privé : une URL signée par photo, en un seul appel.
    const photosSignees = await signerChemins(
      supabase,
      "objet-photos",
      objetRows.map((o) => o.photo_path || ""),
    );

    const objets = objetRows.map((o) => ({
      numero_repertoire: s(o.numero_repertoire),
      rubrique: s(o.rubrique),
      rubrique_label: RUBRIQUE_LABELS[o.rubrique || ""] || s(o.rubrique),
      description: s(o.description || o.titre),
      etat: s(o.etat),
      valeur_exploitation: o.valeur_exploitation ?? 0,
      valeur_reprise: o.valeur_reprise ?? 0,
      estimation_basse: o.estimation_basse ?? 0,
      estimation_haute: o.estimation_haute ?? 0,
      photo_url: photosSignees.get(o.photo_path || "") || s(o.photo_url),
    }));

    type Rubrique = {
      key: string;
      label: string;
      objets: typeof objets;
      sous_total_valeur_exploitation: number;
      sous_total_valeur_reprise: number;
      sous_total_estimation_basse: number;
      sous_total_estimation_haute: number;
      nombre_objets: number;
    };

    const rubriquesMap: Record<string, Rubrique> = {};
    for (const o of objets) {
      const key = o.rubrique || "_sans_";
      if (!rubriquesMap[key]) {
        rubriquesMap[key] = {
          key,
          label: o.rubrique_label || "Sans rubrique",
          objets: [],
          sous_total_valeur_exploitation: 0,
          sous_total_valeur_reprise: 0,
          sous_total_estimation_basse: 0,
          sous_total_estimation_haute: 0,
          nombre_objets: 0,
        };
      }
      const r = rubriquesMap[key];
      r.objets.push(o);
      r.sous_total_valeur_exploitation += Number(o.valeur_exploitation || 0);
      r.sous_total_valeur_reprise += Number(o.valeur_reprise || 0);
      r.sous_total_estimation_basse += Number(o.estimation_basse || 0);
      r.sous_total_estimation_haute += Number(o.estimation_haute || 0);
      r.nombre_objets++;
    }

    const rubriques = Object.values(rubriquesMap);

    const totals = {
      total_valeur_exploitation: objets.reduce((sum, o) => sum + Number(o.valeur_exploitation || 0), 0),
      total_valeur_reprise: objets.reduce((sum, o) => sum + Number(o.valeur_reprise || 0), 0),
      total_estimation_basse: objets.reduce((sum, o) => sum + Number(o.estimation_basse || 0), 0),
      total_estimation_haute: objets.reduce((sum, o) => sum + Number(o.estimation_haute || 0), 0),
    };

    extras.inventaire = {
      nombre_objets: objets.length,
      ...totals,
      ...(type === "inventaire_judiciaire" ? { date: common.date_courrier } : {}),
    };
    extras.objets = objets;
    extras.rubriques = rubriques;
  }

  if (type === "inventaire_judiciaire") {
    const { data: lieuxData } = await supabase
      .from("dossier_lieux")
      .select("adresse,contact_nom,contact_telephone,notes")
      .eq("dossier_id", dossier.id);
    const { data: contratsData } = await supabase
      .from("dossier_contrats")
      .select("type,description,restituer_avant,fichier_url,fichier_path")
      .eq("dossier_id", dossier.id);

    type ContratRow = { type: string | null; description: string | null; restituer_avant: string | null; fichier_url: string | null; fichier_path: string | null };
    const contratRows = (contratsData || []) as ContratRow[];
    // Fichiers de contrats : bucket privé dossier-docs, un lien signé par fichier.
    const contratsSignes = await signerChemins(supabase, "dossier-docs", contratRows.map((c) => c.fichier_path || ""));

    extras.lieux_stockage = (lieuxData || []).map((l: { adresse: string | null; contact_nom: string | null; contact_telephone: string | null; notes: string | null }) => ({
      adresse: s(l.adresse),
      contact_nom: s(l.contact_nom),
      contact_telephone: s(l.contact_telephone),
      notes: s(l.notes),
    }));

    extras.contrats_annexes = contratRows.map((c) => ({
      type: s(c.type),
      type_label: CONTRAT_TYPE_LABELS[c.type || ""] || s(c.type),
      description: s(c.description),
      restituer_avant: formatDateFR(c.restituer_avant),
      restituer_avant_iso: s(c.restituer_avant),
      fichier_url: (c.fichier_path && contratsSignes.get(c.fichier_path)) || s(c.fichier_url),
    }));
  }

  if (type === "requete") {
    extras.requete = {
      objet: options?.objet || "Requête aux fins de vente aux enchères publiques",
      corps: options?.corps || "",
    };
  }

  if (type === "note_honoraires") {
    const tauxTva = Number(options?.taux_tva ?? 20);
    const montantHt = Number(options?.montant_ht ?? 0);
    const montantTva = round2(montantHt * (tauxTva / 100));
    const montantTtc = round2(montantHt + montantTva);
    extras.honoraires = {
      numero_facture: numero_facture || "",
      date_facture: common.date_courrier,
      description_prestation: options?.description_prestation || "",
      montant_ht: round2(montantHt),
      taux_tva: tauxTva,
      montant_tva: montantTva,
      montant_ttc: montantTtc,
      mode_reglement: options?.mode_reglement || "virement",
      iban: s(organisation?.iban),
    };
  }

  if (type === "courrier_envoi") {
    const destType = destinataire || null;
    let nom = "";
    let adresse = "";
    let telephone = "";
    let email = "";
    if (destType === "juge_commissaire") {
      nom = s(dossier.juge_commissaire);
      adresse = s(dossier.juge_commissaire_adresse);
    } else if (destType === "mandataire") {
      nom = s(dossier.mandataire);
      adresse = s(dossier.mandataire_adresse);
    } else if (destType === "administrateur") {
      nom = s(dossier.administrateur);
      adresse = s(dossier.administrateur_adresse);
    } else if (destType === "greffe") {
      nom = s(dossier.tribunal);
      adresse = s(dossier.greffe_adresse);
    } else if (destType === "gerant") {
      nom = s(dossier.gerant_nom);
      adresse = s(dossier.gerant_adresse);
      telephone = s(dossier.gerant_telephone);
      email = s(dossier.gerant_email);
    }

    extras.destinataire = {
      type: s(destType),
      label: destType ? DESTINATAIRE_LABELS[destType] || "" : "",
      nom,
      adresse,
      telephone,
      email,
    };

    extras.courrier = {
      objet:
        options?.objet ||
        `Dossier ${s(dossier.numero)} — ${s(dossier.debiteur_nom)}`,
      corps: options?.corps || "",
      piece_jointe_label: options?.piece_jointe_label || "",
    };
  }

  return { ...common, ...extras };
}
