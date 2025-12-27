import { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-400">Cargando…</div>}>
      <ProfileClient />
    </Suspense>
  );
}