"use client";

import { useSearchParams } from "next/navigation";
// 👇 IMPORTA AQUÍ tu componente actual (el que estaba en page.tsx)
// Ajusta el path/nombre según tu proyecto.
import ProfilePage from "./profile/page";

export default function OnboardingClient() {
  // solo para que Next deje de llorar en build
  useSearchParams();

  // si tu /onboarding era un redirect o wrapper, aquí renderizas lo mismo que antes
  return <ProfilePage />;
}