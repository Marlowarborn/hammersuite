export const MOCK_SALES = [
  { id: "s1", name: "Modern & Contemporary Art", date: "2026-04-18", location: "Paris — Salle Drouot", status: "active" as const, lots: 84, estimate: "1.2M – 1.8M", notes: "", category: "" },
  { id: "s2", name: "Jewellery & Fine Silver", date: "2026-04-24", location: "Lyon — Hotel des Ventes", status: "active" as const, lots: 142, estimate: "320K – 480K", notes: "", category: "" },
  { id: "s3", name: "Old Masters & European Paintings", date: "2026-05-07", location: "Paris — Salle Drouot", status: "upcoming" as const, lots: 67, estimate: "850K – 1.4M", notes: "", category: "" },
  { id: "s4", name: "Design & Decorative Arts", date: "2026-05-15", location: "Bordeaux — Hotel des Ventes", status: "upcoming" as const, lots: 210, estimate: "180K – 290K", notes: "", category: "" },
  { id: "s5", name: "Asian Art & Ceramics", date: "2026-03-12", location: "Paris — Salle Drouot", status: "completed" as const, lots: 95, estimate: "740K – 1.1M", notes: "", category: "" },
];

export const MOCK_LOTS = [
  { id: "l1", number: "001", title: "Joan Miro — Composition abstraite", artist: "Joan Miro", category: "Peinture moderne", estLow: 45000, estHigh: 65000, status: "catalogued" as const, saleId: "s1", description: "Huile sur toile, signee en bas a droite.", provenance: "Collection particuliere, Paris", dimensions: "46 x 61 cm", hammer: null },
  { id: "l2", number: "002", title: "Bague solitaire diamant, 3.2ct", artist: "", category: "Joaillerie", estLow: 28000, estHigh: 34000, status: "pending" as const, saleId: "s2", description: "Diamant taille brillant, monture platine.", provenance: "Succession privee, Lyon", dimensions: "—", hammer: null },
  { id: "l3", number: "003", title: "Jean-Baptiste-Camille Corot — Paysage normand", artist: "J.B.C. Corot", category: "Peinture ancienne", estLow: 80000, estHigh: 120000, status: "catalogued" as const, saleId: "s3", description: "Huile sur toile, signee. Circa 1860.", provenance: "Galerie Bernheim-Jeune, Paris", dimensions: "38 x 55 cm", hammer: null },
  { id: "l4", number: "004", title: "Chaise longue LC4, Le Corbusier", artist: "Le Corbusier", category: "Design", estLow: 12000, estHigh: 18000, status: "pending" as const, saleId: "s4", description: "Edition Cassina, acier chrome et cuir noir.", provenance: "Collection privee, Bordeaux", dimensions: "160 x 56 x 80 cm", hammer: null },
  { id: "l5", number: "005", title: "Vase en porcelaine, Chine, periode Qianlong", artist: "", category: "Ceramique asiatique", estLow: 35000, estHigh: 50000, status: "sold" as const, saleId: "s5", description: "Porcelaine a decor polychrome.", provenance: "Collection europeenne avant 1970", dimensions: "H. 42 cm", hammer: 58000 },
  { id: "l6", number: "006", title: "Collier de perles naturelles, 48 elements", artist: "", category: "Joaillerie", estLow: 15000, estHigh: 22000, status: "catalogued" as const, saleId: "s2", description: "Perles naturelles non traitees, fermoir or jaune 18k.", provenance: "Succession Moreau-Valentin", dimensions: "L. 82 cm", hammer: null },
];

export const MOCK_CLIENTS = [
  { id: "c1", name: "Editions Bergmann et Fils", type: "Dealer" as const, contact: "G. Bergmann", email: "g.bergmann@editions-bergmann.fr", phone: "+33 1 42 36 88 10", lots: 12, status: "active" as const },
  { id: "c2", name: "Succession Moreau-Valentin", type: "Estate" as const, contact: "Me. Valentin", email: "cabinet.valentin@notaires.fr", phone: "+33 1 47 20 14 52", lots: 34, status: "active" as const },
  { id: "c3", name: "Mme. Elise Fontaine-Roux", type: "Collector" as const, contact: "E. Fontaine-Roux", email: "e.fontaine@outlook.com", phone: "+33 6 12 44 87 23", lots: 5, status: "active" as const },
  { id: "c4", name: "Galerie Marchetti", type: "Dealer" as const, contact: "L. Marchetti", email: "l.marchetti@galerie-marchetti.com", phone: "+33 1 45 63 22 90", lots: 8, status: "active" as const },
];

export const MOCK_ACTIVITY = [
  { id: 1, action: "Lot 005 adjuge", detail: "Vase Qianlong — 58 000 EUR", time: "Il y a 2h", type: "sale" as const },
  { id: 2, action: "Catalogue genere", detail: "Joaillerie et Argenterie Fine — 142 lots", time: "Il y a 5h", type: "catalogue" as const },
  { id: 3, action: "Nouveau client", detail: "Succession Moreau-Valentin ajoutee", time: "Hier", type: "client" as const },
  { id: 4, action: "Vente creee", detail: "Old Masters and European Paintings — 67 lots", time: "Hier", type: "sale" as const },
  { id: 5, action: "Images traitees", detail: "84 images — Vente Art Contemporain", time: "Il y a 3 jours", type: "catalogue" as const },
];
