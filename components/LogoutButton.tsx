"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="mt-4 rounded-xl border px-4 py-2"
    >
      Cerrar sesión
    </button>
  );
}