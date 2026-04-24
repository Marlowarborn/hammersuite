"use client";

import { useState } from "react";

type TypeEntree = "volontaire" | "judiciaire" | "depot";
type StatusObjet = "en_attente" | "attribue" | "vendu" | "invendu" | "restitue";

type Objet = {
  id: string;
  numero_repertoire: string;
  date_entree: string;
  type_entree: TypeEntree;
  titre: string;
  description: string;
  artiste: string;
  dimensions: string;
  technique: string;
  epoque: string;
  provenance: string;
  consignateur: string;
  estimation_basse: number;
  estimation_haute: number;
  status: StatusObjet;
  vente_id: string | null;
  numero_lot: string | null;
  prix_adjudication: number | null;
  notes: string;
};

const MOCK_OBJETS: Objet[] = [
  {
    id: "o1",
    numero_repertoire: "2026-001",
    date_entree: "2026-03-15",
    type_entree: "volontaire",
    titre: "Composition abstraite",
    description: "Huile sur toile signée en bas à droite",
    artiste: "Joan Miró",
    dimensions: "46 × 61 cm",
    technique: "Huile sur toile",
    epoque: "Circa 1965",
    provenance: "Collection particulière, Paris",
    consignateur: "Mme. Fontaine-Roux",
    estimation_basse: 45000,
    estimation_haute: 65000,
    status: "attribue",
    vente_id: "s1",
    numero_lot: "001",
    prix_adjudication: null,
    notes: "",
  },
  {
    id: "o2",
    numero_repertoire: "2026-002",
    date_entree: "2026-03-18",
    type_entree: "judiciaire",
    titre: "Bague solitaire diamant 3.2ct",
    description: "Diamant taille brillant, monture platine",
    artiste: "",
    dimensions: "—",
    technique: "Joaillerie",
    epoque: "Contemporain",
    provenance: "Saisie judiciaire, TGI Paris",
    consignateur: "Tribunal de Paris",
    estimation_basse: 28000,
    estimation_haute: 34000,
    status: "en_attente",
    vente_id: null,
    numero_lot: null,
    prix_adjudication: null,
    notes: "Dossier n°2026-TGI-0892",
  },
  {
    id: "o3",
    numero_repertoire: "2026-003",
    date_entree: "2026-03-22",
    type_entree: "volontaire",
    titre: "Paysage normand au crépuscule",
    description: "Huile sur toile signée en bas à gauche",
    artiste: "J.B.C. Corot",
    dimensions: "38 × 55 cm",
    technique: "Huile sur toile",
    epoque: "Circa 1860",
    provenance: "Galerie Bernheim-Jeune",
    consignateur: "Succession Moreau-Valentin",
    estimation_basse: 80000,
    estimation_haute: 120000,
    status: "en_attente",
    vente_id: null,
    numero_lot: null,
    prix_adjudication: null,
    notes: "",
  },
  {
    id: "o4",
    numero_repertoire: "2026-004",
    date_entree: "2026-03-28",
    type_entree: "depot",
    titre: "Chaise longue LC4",
    description: "Édition Cassina, acier chromé et cuir noir",
    artiste: "Le Corbusier & C. Perriand",
    dimensions: "160 × 56 × 80 cm",
    technique: "Acier chromé, cuir",
    epoque: "Circa 1980",
    provenance: "Collection privée, Bordeaux",
    consignateur: "Galerie Marchetti",
    estimation_basse: 12000,
    estimation_haute: 18000,
    status: "vendu",
    vente_id: "s5",
    numero_lot: "042",
    prix_adjudication: 16500,
    notes: "",
  },
  {
    id: "o5",
    numero_repertoire: "2026-005",
    date_entree: "2026-04-02",
    type_entree: "judiciaire",
    titre: "Vase en porcelaine, période Qianlong",
    description: "Porcelaine à décor polychrome de fleurs et oiseaux",
    artiste: "",
    dimensions: "H. 42 cm",
    technique: "Porcelaine émaillée",
    epoque: "Période Qianlong 1735-1796",
    provenance: "Collection européenne avant 1970",
    consignateur: "Tribunal de Lyon",
    estimation_basse: 35000,
    estimation_haute: 50000,
    status: "invendu",
    vente_id: "s5",
    numero_lot: "089",
    prix_adjudication: null,
    notes: "Restitution prévue le 15/05/2026",
  },
];

const STATUS_STYLES: Record<StatusObjet, { bg: string; color: string; label: string }> = {
  en_attente: { bg: "rgba(154,111,46,0.1)", color: "var(--warning)", label: "En attente" },
  attribue: { bg: "rgba(61,122,94,0.1)", color: "var(--success)", label: "Attribué" },
  vendu: { bg: "var(--cream)", color: "var(--muted)", label: "Vendu" },
  invendu: { bg: "rgba(139,58,58,0.1)", color: "var(--error)", label: "Invendu" },
  restitue: { bg: "var(--surface)", color: "var(--muted)", label: "Restitué" },
};

const TYPE_STYLES: Record<TypeEntree, { label: string; color: string }> = {
  volontaire: { label: "Volontaire", color: "var(--accent)" },
  judiciaire: { label: "Judiciaire", color: "var(--ink)" },
  depot: { label: "Dépôt", color: "var(--muted)" },
};

const NEXT_NUMERO = (objets: Objet[]) => {
  const year = new Date().getFullYear();
  const max = objets
    .filter(o => o.numero_repertoire.startsWith(String(year)))
    .map(o => parseInt(o.numero_repertoire.split("-")[1]) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${year}-${String(max + 1).padStart(3, "0")}`;
};

export default function LotsPage() {
  const [objets, setObjets] = useState<Objet[]>(MOCK_OBJETS);
  const [selected, setSelected] = useState<Objet | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<StatusObjet | "all">("all");
  const [search, setSearch] = useState("");
  const [newObjet, setNewObjet] = useState({
    titre: "",
    artiste: "",
    description: "",
    type_entree: "volontaire" as TypeEntree,
    date_entree: new Date().toISOString().split("T")[0],
    consignateur: "",
    estimation_basse: "",
    estimation_haute: "",
    technique: "",
    dimensions: "",
    epoque: "",
    provenance: "",
    notes: "",
  });

  const filtered = objets.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = search === "" ||
      o.titre.toLowerCase().includes(search.toLowerCase()) ||
      o.artiste.toLowerCase().includes(search.toLowerCase()) ||
      o.numero_repertoire.toLowerCase().includes(search.toLowerCase()) ||
      o.consignateur.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleCreate = () => {
    if (!newObjet.titre) return;
    const objet: Objet = {
      id: `o${Date.now()}`,
      numero_repertoire: NEXT_NUMERO(objets),
      date_entree: newObjet.date_entree,
      type_entree: newObjet.type_entree,
      titre: newObjet.titre,
      description: newObjet.description,
      artiste: newObjet.artiste,
      dimensions: newObjet.dimensions,
      technique: newObjet.technique,
      epoque: newObjet.epoque,
      provenance: newObjet.provenance,
      consignateur: newObjet.consignateur,
      estimation_basse: parseInt(newObjet.estimation_basse) || 0,
      estimation_haute: parseInt(newObjet.estimation_haute) || 0,
      status: "en_attente",
      vente_id: null,
      numero_lot: null,
      prix_adjudication: null,
      notes: newObjet.notes,
    };
    setObjets([objet, ...objets]);
    setShowCreate(false);
    setSelected(objet);
    setNewObjet({
      titre: "", artiste: "", description: "",
      type_entree: "volontaire",
      date_entree: new Date().toISOString().split("T")[0],
      consignateur: "", estimation_basse: "", estimation_haute: "",
      technique: "", dimensions: "", epoque: "", provenance: "", notes: "",
    });
  };

  const counts = {
    all: objets.length,
    en_attente: objets.filter(o => o.status === "en_attente").length,
    attribue: objets.filter(o => o.status === "attribue").length,
    vendu: objets.filter(o => o.status === "vendu").length,
    invendu: objets.filter(o => o.status === "invendu").length,
    restitue: objets.filter(o => o.status === "restitue").length,
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
            Répertoire
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            {objets.length} objets · {counts.en_attente} en attente d&apos;attribution
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--black)", color: "white", border: "none",
          cursor: "pointer", padding: "9px 18px", borderRadius: "var(--radius)",
          fontSize: 13, fontWeight: 500,
        }}>
          + Enregistrer un objet
        </button>
      </div>

      {/* Filters + Search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {([["all", "Tous"], ["en_attente", "En attente"], ["attribue", "Attribués"], ["vendu", "Vendus"], ["invendu", "Invendus"], ["restitue", "Restitués"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500,
                border: "1px solid",
                borderColor: filter === key ? "var(--black)" : "var(--border)",
                background: filter === key ? "var(--black)" : "transparent",
                color: filter === key ? "white" : "var(--muted)",
                cursor: "pointer",
              }}>
              {label} <span style={{ opacity: 0.6 }}>({counts[key as keyof typeof counts]})</span>
            </button>
          ))}
        </div>
        <input
          placeholder="Rechercher un objet, artiste, consignateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "7px 12px",
            border: "1px solid var(--border)", borderRadius: "var(--radius)",
            fontSize: 13, fontFamily: "var(--font-sans)", outline: "none",
            background: "var(--white)", color: "var(--ink)",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap: 20 }}>
        {/* Table */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "110px 1fr 120px 140px 100px 100px", gap: 12 }}>
            {["N° Répertoire", "Objet", "Type", "Consignateur", "Estimation", "Statut"].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>{h}</p>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              Aucun objet trouvé
            </div>
          )}
          {filtered.map((objet, i) => {
            const s = STATUS_STYLES[objet.status];
            const t = TYPE_STYLES[objet.type_entree];
            return (
              <div key={objet.id}
                onClick={() => setSelected(selected?.id === objet.id ? null : objet)}
                style={{
                  padding: "14px 20px",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  display: "grid", gridTemplateColumns: "110px 1fr 120px 140px 100px 100px",
                  gap: 12, alignItems: "center", cursor: "pointer",
                  background: selected?.id === objet.id ? "var(--accent-light)" : "transparent",
                  transition: "background var(--transition)",
                }}
                onMouseEnter={e => { if (selected?.id !== objet.id) e.currentTarget.style.background = "var(--surface)"; }}
                onMouseLeave={e => { if (selected?.id !== objet.id) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                  {objet.numero_repertoire}
                </span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--black)", marginBottom: 1 }}>{objet.titre}</p>
                  {objet.artiste && <p style={{ fontSize: 12, color: "var(--muted)" }}>{objet.artiste}</p>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.color }}>{t.label}</span>
                <p style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {objet.consignateur || "—"}
                </p>
                <p style={{ fontSize: 12, fontFamily: "var(--font-serif)", color: "var(--ink)" }}>
                  {objet.estimation_basse.toLocaleString()} – {objet.estimation_haute.toLocaleString()} €
                </p>
                <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", height: "fit-content" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                  Répertoire {selected.numero_repertoire}
                </p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: STATUS_STYLES[selected.status].bg, color: STATUS_STYLES[selected.status].color }}>
                  {STATUS_STYLES[selected.status].label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18 }}>×</button>
            </div>

            {/* Image placeholder */}
            <div style={{ background: "var(--cream)", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Aucune photo</p>
              <button style={{ padding: "6px 14px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, cursor: "pointer" }}>
                + Ajouter des photos
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--black)", marginBottom: 4, lineHeight: 1.3 }}>{selected.titre}</h3>
              {selected.artiste && <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginBottom: 16 }}>{selected.artiste}</p>}

              <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, marginBottom: 16 }}>{selected.description}</p>

              {[
                ["Date d'entrée", new Date(selected.date_entree).toLocaleDateString("fr-FR")],
                ["Type", TYPE_STYLES[selected.type_entree].label],
                ["Consignateur", selected.consignateur],
                ["Technique", selected.technique],
                ["Dimensions", selected.dimensions],
                ["Époque", selected.epoque],
                ["Provenance", selected.provenance],
                ["Estimation", `${selected.estimation_basse.toLocaleString()} – ${selected.estimation_haute.toLocaleString()} €`],
                ...(selected.vente_id ? [["Vente", selected.vente_id], ["N° lot", selected.numero_lot || "—"]] : []),
                ...(selected.prix_adjudication ? [["Prix d'adjudication", `${selected.prix_adjudication.toLocaleString()} €`]] : []),
                ...(selected.notes ? [["Notes", selected.notes]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)", flexShrink: 0, marginRight: 12 }}>{label}</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "8px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                Attribuer à une vente
              </button>
              <button style={{ padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, cursor: "pointer" }}>
                Modifier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}
          onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--white)", borderRadius: "var(--radius-lg)", padding: 32,
            width: "100%", maxWidth: 600, boxShadow: "var(--shadow-lg)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 className="serif" style={{ fontSize: 24, fontWeight: 500 }}>Enregistrer un objet</h2>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  N° répertoire attribué automatiquement : <strong>{NEXT_NUMERO(objets)}</strong>
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20 }}>×</button>
            </div>

            {/* Type entree */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Type d'entrée</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["volontaire", "judiciaire", "depot"] as TypeEntree[]).map(t => (
                  <button key={t} onClick={() => setNewObjet({ ...newObjet, type_entree: t })}
                    style={{
                      flex: 1, padding: "8px", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer",
                      border: "1.5px solid",
                      borderColor: newObjet.type_entree === t ? "var(--black)" : "var(--border)",
                      background: newObjet.type_entree === t ? "var(--black)" : "transparent",
                      color: newObjet.type_entree === t ? "white" : "var(--muted)",
                    }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Titre / désignation *", key: "titre", placeholder: "ex. Tableau huile sur toile", full: true },
                { label: "Artiste / auteur", key: "artiste", placeholder: "ex. Joan Miró" },
                { label: "Date d'entrée", key: "date_entree", type: "date" },
                { label: "Consignateur", key: "consignateur", placeholder: "ex. Mme. Dupont" },
                { label: "Technique", key: "technique", placeholder: "ex. Huile sur toile" },
                { label: "Dimensions", key: "dimensions", placeholder: "ex. 46 × 61 cm" },
                { label: "Époque / période", key: "epoque", placeholder: "ex. XIXe siècle" },
                { label: "Estimation basse (€)", key: "estimation_basse", type: "number", placeholder: "0" },
                { label: "Estimation haute (€)", key: "estimation_haute", type: "number", placeholder: "0" },
              ].map(field => (
                <div key={field.key} style={{ gridColumn: field.full ? "1 / -1" : "auto" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
                  <input
                    type={field.type || "text"}
                    placeholder={field.placeholder || ""}
                    value={(newObjet as any)[field.key]}
                    onChange={e => setNewObjet({ ...newObjet, [field.key]: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
                <textarea placeholder="Description détaillée de l'objet..."
                  value={newObjet.description}
                  onChange={e => setNewObjet({ ...newObjet, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", resize: "vertical", minHeight: 80 }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Provenance</label>
                <input placeholder="ex. Collection particulière, Paris"
                  value={newObjet.provenance}
                  onChange={e => setNewObjet({ ...newObjet, provenance: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes internes</label>
                <textarea placeholder="Notes internes, dossier judiciaire, conditions particulières..."
                  value={newObjet.notes}
                  onChange={e => setNewObjet({ ...newObjet, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)", resize: "vertical", minHeight: 60 }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleCreate} style={{ padding: "9px 18px", background: "var(--black)", color: "white", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Enregistrer l&apos;objet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
