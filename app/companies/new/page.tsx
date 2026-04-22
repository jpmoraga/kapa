export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function companyCreationErrorMessage(code: string | undefined) {
  switch (code) {
    case "company_name_too_short":
      return "El nombre de la empresa debe tener al menos 3 caracteres.";
    case "company_name_reserved":
      return "Ese nombre está reservado y no se puede usar.";
    case "company_rut_exists":
      return "Ya existe una empresa business con ese RUT.";
    case "invalid_document_type":
      return "El documento debe ser PDF, JPG, PNG o WEBP.";
    case "document_too_large":
      return "El documento supera el máximo permitido de 10 MB.";
    default:
      return code ? "No se pudo crear la empresa." : null;
  }
}

function statusLabel(status: string | null | undefined) {
  switch (status) {
    case "APPROVED":
      return "Aprobada";
    case "OBSERVED":
      return "Observada";
    case "REJECTED":
      return "Rechazada";
    case "PENDING":
      return "Pendiente";
    default:
      return "Sin revisión";
  }
}

export default async function NewCompanyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login?callbackUrl=/companies/new");
  }

  const email = session.user.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      companyUsers: {
        where: {
          company: {
            kind: "BUSINESS",
            name: { not: "__SYSTEM_WALLET__" },
          },
        },
        select: {
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              companyRut: true,
              review: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
        orderBy: {
          companyId: "asc",
        },
      },
    },
  });

  if (!user) redirect("/auth/login");

  const sp = searchParams ? await searchParams : {};
  const created = firstString(sp.created) === "1";
  const createdCompanyId = firstString(sp.companyId);
  const error = companyCreationErrorMessage(firstString(sp.error));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Empresas / Nueva</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Crear empresa pyme básica
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Este flujo crea una empresa <code>BUSINESS</code> y la deja pendiente de revisión
              manual. No crea movimientos, no toca balances y no cambia tu empresa activa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="k21-btn-secondary px-3 py-2 text-sm">
              Volver al dashboard
            </Link>
            <Link href="/select-company?force=1" className="k21-btn-secondary px-3 py-2 text-sm">
              Cambiar cuenta
            </Link>
          </div>
        </div>
      </div>

      {created ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Empresa creada. Quedó pendiente de revisión manual.
          {createdCompanyId ? (
            <span className="block pt-2 text-xs text-emerald-200">
              Company ID: <code>{createdCompanyId}</code>
            </span>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Formulario</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Datos mínimos de la empresa</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Puedes adjuntar un documento simple o dejar una nota sobre la evidencia entregada.
          </p>

          <form action="/api/companies" method="post" encType="multipart/form-data" className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80">Nombre empresa</label>
              <input
                name="companyName"
                required
                minLength={3}
                placeholder="Comercializadora XYZ SpA"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">RUT o identificador</label>
              <input
                name="companyRut"
                placeholder="76.123.456-7"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Nota para revisión</label>
              <textarea
                name="submissionNote"
                rows={4}
                placeholder="Contexto básico de la empresa, giro o lo que deba revisar el admin."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Documento opcional</label>
              <input
                name="documentFile"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="mt-2 block w-full text-sm text-neutral-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white"
              />
              <p className="mt-2 text-xs text-neutral-500">PDF, JPG, PNG o WEBP. Máximo 10 MB.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Nota del documento</label>
              <input
                name="documentNote"
                placeholder="Ej: Escritura enviada por correo o RUT empresa adjunto."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
              Crear empresa business
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Estado del flujo</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-200">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                La empresa nace en estado pendiente para revisión admin.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                No se crea ni aprueba ninguna operación patrimonial.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Tu empresa personal actual sigue intacta y permanece como contexto activo.
              </li>
            </ul>
          </section>

          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Tus empresas business</div>
            {user.companyUsers.length ? (
              <div className="mt-4 space-y-3">
                {user.companyUsers.map((membership) => (
                  <div
                    key={membership.company.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{membership.company.name}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {membership.company.companyRut ?? "Sin RUT"} · rol {membership.role}
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-neutral-300">
                        {statusLabel(membership.company.review?.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                Todavía no tienes empresas business creadas desde este flujo.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
