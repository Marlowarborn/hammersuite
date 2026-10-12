import ModuleEnPreparation from "@/components/app/ModuleEnPreparation";

export default function CrmPage() {
  return (
    <ModuleEnPreparation
      titre="Clients"
      description="Le fichier des vendeurs, acheteurs, mandataires et correspondants n'est pas encore disponible. Il portera aussi les obligations de vigilance (identité, seuils, gel des avoirs)."
      prevu={[
        "Fiches vendeurs, acheteurs, successions, marchands et mandataires",
        "Mandats et historique des dépôts et des achats",
        "Vérification d'identité et vigilance LCB-FT au-dessus des seuils",
        "Lien avec les bordereaux et les règlements",
      ]}
    />
  );
}
