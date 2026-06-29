import BackofficePageHeader from "../../_components/BackofficePageHeader";
import ConsultingCsvImportClient from "./_components/ConsultingCsvImportClient";

export default function BackofficeConsultingImportPage() {
  return (
    <div className="mx-auto max-w-[1760px] px-5 py-5 lg:px-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Consulting / Import"
        title="Importar CSV histórico"
        description="Herramienta segura para cargar la base histórica de Consulting desde un CSV exportado de Google Sheets, con preview obligatoria antes de mutar datos."
      />

      <div className="mt-4">
        <ConsultingCsvImportClient />
      </div>
    </div>
  );
}
