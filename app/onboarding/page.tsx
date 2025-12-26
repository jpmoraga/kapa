// web/app/onboarding/page.tsx
import OnboardingProfileForm from "./profile-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 p-6">
        <h1 className="text-xl font-semibold">Onboarding</h1>
        <p className="text-sm text-white/60 mt-1">
          Paso 1: completa tu perfil para poder operar.
        </p>

        <div className="mt-6">
          <OnboardingProfileForm />
        </div>
      </div>
    </main>
  );
}