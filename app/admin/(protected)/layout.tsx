import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import AdminNavigation from "./_components/AdminNavigation";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto min-h-screen max-w-[1680px] lg:flex">
        <AdminNavigation
          adminEmail={session.admin.email}
          adminRole={String(session.admin.role).toUpperCase()}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
