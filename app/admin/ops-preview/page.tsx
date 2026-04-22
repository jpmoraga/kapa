import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";

export default async function AdminOpsPreviewPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  redirect("/admin/ops");
}
