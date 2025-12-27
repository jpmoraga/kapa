"use client";

import { useSearchParams } from "next/navigation";
import ProfileForm from "../profile-form"; // ✅ este archivo existe en tu proyecto

export default function ProfileClient() {
  useSearchParams(); // ✅ esto obliga a estar dentro de Suspense
  return <ProfileForm />;
}