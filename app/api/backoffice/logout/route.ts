export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  BACKOFFICE_SESSION_COOKIE,
  deleteBackofficeSessionByToken,
} from "@/lib/backofficeAuth";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(BACKOFFICE_SESSION_COOKIE)?.value;

  await deleteBackofficeSessionByToken(token);

  const res = NextResponse.redirect(new URL("/backoffice/login", req.url));
  res.cookies.set(BACKOFFICE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}
