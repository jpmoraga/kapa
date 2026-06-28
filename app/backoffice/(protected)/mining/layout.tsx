import { redirect } from "next/navigation";
import { getBackofficeSession } from "@/lib/backofficeAuth";
import { canAccessBackofficeSection } from "@/lib/backofficePermissions";

export default async function BackofficeMiningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getBackofficeSession();
  if (!session) redirect("/backoffice/login");
  if (!canAccessBackofficeSection(session.user.role, "mining")) {
    redirect("/backoffice");
  }

  return children;
}
