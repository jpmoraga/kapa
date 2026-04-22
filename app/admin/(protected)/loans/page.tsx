import AdminPlaceholderPage from "../_components/AdminPlaceholderPage";

export default function AdminLoansPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Admin / Créditos"
      title="Créditos"
      description="Base del futuro módulo de créditos administrados manualmente. Esta fase no amplía el flujo actual ni introduce operaciones productivas nuevas."
      readyItems={[
        "Ruta protegida bajo master admin.",
        "Punto estable para separar el futuro módulo admin del flujo actual de simulación.",
        "Espacio reservado para pipeline, aprobación y seguimiento.",
      ]}
      nextPhaseItems={[
        "Vista admin de solicitudes y créditos abiertos.",
        "Modelo seguro de reserva de colateral y desembolso.",
        "Registro auditado de eventos y acciones admin sobre créditos.",
      ]}
      tableColumns={["Crédito", "Cliente", "Estado", "Colateral", "Acción"]}
      emptyMessage="La administración segura de créditos queda pendiente para la siguiente fase."
      searchPlaceholder="Buscar por cliente o crédito (próximamente)"
    />
  );
}
