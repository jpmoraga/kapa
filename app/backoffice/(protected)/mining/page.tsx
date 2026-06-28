import BackofficePageHeader from "../_components/BackofficePageHeader";

export default function BackofficeMiningPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining"
        title="Mining"
        description="Reserva segura para el pipeline privado y compartido de Mining."
      />

      <section className="mt-6 k21-card p-6">
        <div className="text-lg font-semibold text-white">Pipeline Mining próximamente</div>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Aquí irá la base del módulo Mining nuevo, incluyendo sus futuras vistas privadas y
          compartidas, sin mezclarse con el admin anterior.
        </p>
      </section>
    </div>
  );
}
