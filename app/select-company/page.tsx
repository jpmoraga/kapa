export const runtime = "nodejs";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import SelectCompanyClient from "./select-company-client";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SelectCompanyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const sp = searchParams ? await searchParams : {};
  const force = firstString(sp.force) === "1";

  // ✅ Si ya hay cuenta activa, no mostrar esta página
  const activeCompanyId = (session as typeof session & { activeCompanyId?: string }).activeCompanyId;
  if (activeCompanyId && !force) redirect("/dashboard");

  const email = session.user.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) redirect("/auth/login");

  const memberships = await prisma.companyUser.findMany({
    where: { userId: user.id },
    select: {
      role: true,
      company: {
        select: {
          id: true,
          name: true,
          kind: true,
          review: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  const companies = memberships
    .map((m) => ({
      companyId: m.company.id,
      name: m.company.name,
      role: m.role,
      kind: m.company.kind,
      reviewStatus: m.company.review?.status ?? null,
    }))
    .sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === "PERSONAL" ? -1 : 1;
    });

  // ✅ Si solo hay 1 cuenta y no hay activa, setear en DB y redirigir
  if (!activeCompanyId && !force && companies.length === 1) {
    const onlyCompanyId = companies[0].companyId;
    console.log("[select-company] auto-activating company", {
      userId: user.id,
      companyId: onlyCompanyId,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCompanyId: onlyCompanyId },
    });
    console.log("[select-company] activeCompanyId persisted, redirecting", {
      userId: user.id,
      companyId: onlyCompanyId,
    });
    redirect("/dashboard");
  }

  return <SelectCompanyClient companies={companies} allowAutoPick={!force} />;
}
