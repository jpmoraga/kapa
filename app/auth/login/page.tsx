import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md k21-card p-6 text-sm text-white/60">Cargando...</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
