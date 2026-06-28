import { redirect } from "next/navigation";
import { getBackofficeSession } from "@/lib/backofficeAuth";
import BackofficeLoginClient from "./BackofficeLoginClient";

export default async function BackofficeLoginPage() {
  const session = await getBackofficeSession();
  if (session) redirect("/backoffice");

  return <BackofficeLoginClient />;
}
