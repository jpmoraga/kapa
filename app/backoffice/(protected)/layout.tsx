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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto min-h-screen max-w-[1680px] lg:flex">
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
