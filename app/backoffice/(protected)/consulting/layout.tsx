import { redirect } from "next/navigation";
import { getBackofficeSession } from "@/lib/backofficeAuth";
import { canAccessBackofficeSection } from "@/lib/backofficePermissions";

export default async function BackofficeConsultingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getBackofficeSession();
  if (!session) redirect("/backoffice/login");
  if (!canAccessBackofficeSection(session.user.role, "consulting")) {
    redirect("/backoffice");
  }

  return children;
}
