import BackofficePageHeader from "../_components/BackofficePageHeader";

export default function BackofficeConsultingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BackofficePageHeader
        eyebrow="Backoffice / Consulting"
        title="Consulting"
        description="Reserva segura para el pipeline comercial de Consulting."
      />

      <section className="mt-6 k21-card p-6">
        <div className="text-lg font-semibold text-white">
          Pipeline Consulting próximamente
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Esta pantalla queda protegida y lista para recibir el flujo comercial nuevo, separado del
          admin legado.
        </p>
      </section>
    </div>
  );
}
