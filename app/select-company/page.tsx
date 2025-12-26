import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import SelectCompanyClient from "./select-company-client";

export default async function SelectCompanyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const email = session.user.email.toLowerCase().trim();

  // 1) Buscar user por email (esto en tu schema existe y es unique)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) redirect("/auth/login");

  // 2) Traer memberships por userId (sin depender de relation filters)
  const memberships = await prisma.companyUser.findMany({
    where: { userId: user.id },
    select: {
      role: true,
      company: { select: { id: true, name: true, kind: true } }, // ✅ kind
    },
  });

  const companies = memberships
    .map((m) => ({
      companyId: m.company.id,
      name: m.company.name,
      role: m.role,
      kind: m.company.kind, // PERSONAL | BUSINESS
    }))
    .sort((a, b) => {
      // PERSONAL primero
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === "PERSONAL" ? -1 : 1;
    });

  return <SelectCompanyClient companies={companies} />;
}