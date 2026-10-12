import ModuleEnPreparation from "@/components/app/ModuleEnPreparation";

export default function EstimatesPage() {
  return (
    <ModuleEnPreparation
      titre="Estimations"
      description="Les demandes d'estimation et les lettres d'estimation ne sont pas encore disponibles. Les comparables de marché dépendent d'accords de données qui n'existent pas encore."
      prevu={[
        "Demande d'estimation depuis une photo ou un document",
        "Lettre d'estimation formelle, signée par l'étude",
        "Suivi des demandes jusqu'au mandat",
      ]}
    />
  );
}
