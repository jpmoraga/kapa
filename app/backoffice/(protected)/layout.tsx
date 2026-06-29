import { redirect } from "next/navigation";
import { getBackofficeSession } from "@/lib/backofficeAuth";
import BackofficeNav from "./_components/BackofficeNav";

export default async function BackofficeProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getBackofficeSession();
  if (!session) redirect("/backoffice/login");

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(247,147,26,0.09),transparent_22%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_24%)]" />
      <div className="relative mx-auto min-h-screen max-w-[1900px] lg:flex">
        <BackofficeNav
          userEmail={session.user.email}
          userName={session.user.name}
          userRole={session.user.role}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
