import ResetPasswordClient from "./ResetPasswordClient";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const token = firstString(sp.token) ?? "";

  return <ResetPasswordClient token={token} />;
}
