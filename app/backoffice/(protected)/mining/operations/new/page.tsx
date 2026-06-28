import { redirect } from "next/navigation";

export default function BackofficeMiningOperationNewPage() {
  redirect("/backoffice/mining?operationFlow=prospects");
}
