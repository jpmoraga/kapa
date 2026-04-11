import { NextResponse } from "next/server";
import {
  FRIENDS_FAMILY_ACCESS_COOKIE,
  createAccessCookieValue,
  isValidAccessKey,
} from "../_lib/access";

export async function POST(request: Request) {
  const formData = await request.formData();
  const submittedKey = String(formData.get("accessKey") || "");

  if (!isValidAccessKey(submittedKey)) {
    return NextResponse.redirect(new URL("/friends-and-family?error=1", request.url));
  }

  const response = NextResponse.redirect(new URL("/friends-and-family", request.url));

  response.cookies.set({
    name: FRIENDS_FAMILY_ACCESS_COOKIE,
    value: createAccessCookieValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/friends-and-family",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
