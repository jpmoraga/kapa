import { redirect } from "next/navigation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string | string[] }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const token = typeof sp.token === "string" ? sp.token : null;

  if (token) {
    redirect(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  return (
    <div>
      <h1>Missing token</h1>
      <p>The verification link is missing a token.</p>
    </div>
  );
}
