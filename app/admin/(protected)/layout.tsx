import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <div className="min-h-screen bg-neutral-950 text-neutral-100">{children}</div>;
}
