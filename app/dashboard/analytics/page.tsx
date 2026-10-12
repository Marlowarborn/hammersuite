import ModuleEnPreparation from "@/components/app/ModuleEnPreparation";

export default function AnalyticsPage() {
  return (
    <ModuleEnPreparation
      titre="Analytiques"
      description="Les tableaux de bord d'activité ne sont pas encore disponibles. Ils seront calculés à partir des ventes, des adjudications et des règlements réels de l'étude."
      prevu={[
        "Taux de vente, montants adjugés, délais de règlement",
        "Activité par dossier, par phase et par collaborateur",
        "Exports comptables",
      ]}
    />
  );
}
