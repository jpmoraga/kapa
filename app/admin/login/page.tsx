import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import AdminLoginClient from "./AdminLoginClient";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return <AdminLoginClient />;
}
