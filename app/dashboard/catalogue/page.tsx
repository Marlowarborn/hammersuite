import ModuleEnPreparation from "@/components/app/ModuleEnPreparation";

export default function CataloguePage() {
  return (
    <ModuleEnPreparation
      titre="Catalogues"
      description="La génération de catalogues imprimables et en ligne n'est pas encore disponible. Elle sera construite à partir des objets du répertoire, avec la mention des descriptions rédigées par IA exigée depuis août 2026."
      prevu={[
        "Composition d'un catalogue à partir d'une vente et de ses lots",
        "Export PDF prêt à imprimer et version en ligne",
        "Mention automatique des contenus générés par IA",
        "Export vers Interenchères et Drouot",
      ]}
    />
  );
}
