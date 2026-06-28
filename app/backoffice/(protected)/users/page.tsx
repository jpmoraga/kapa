import BackofficePageHeader from "../_components/BackofficePageHeader";

export default function BackofficeUsersPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BackofficePageHeader
        eyebrow="Backoffice / Usuarios"
        title="Usuarios"
        description="Reserva segura para la gestión futura de usuarios, roles y permisos del backoffice."
      />

      <section className="mt-6 k21-card p-6">
        <div className="text-lg font-semibold text-white">
          Gestión de usuarios próximamente
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Esta vista queda restringida a `OWNER` y lista para la futura administración de accesos.
        </p>
      </section>
    </div>
  );
}
