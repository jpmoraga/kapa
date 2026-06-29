import type { BackofficeRole } from "@prisma/client";
import { backofficeRoleLabel, getBackofficeNavItems } from "@/lib/backofficePermissions";
import BackofficeNavClient from "./BackofficeNavClient";

export default function BackofficeNav({
  userEmail,
  userName,
  userRole,
}: {
  userEmail: string;
  userName: string | null;
  userRole: BackofficeRole;
}) {
  return (
    <BackofficeNavClient
      items={getBackofficeNavItems(userRole)}
      roleLabel={backofficeRoleLabel(userRole)}
      userEmail={userEmail}
      userName={userName}
    />
  );
}
