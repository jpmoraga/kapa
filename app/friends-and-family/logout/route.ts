import { NextResponse } from "next/server";
import { FRIENDS_FAMILY_ACCESS_COOKIE } from "../_lib/access";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/friends-and-family", request.url));

  response.cookies.set({
    name: FRIENDS_FAMILY_ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/friends-and-family",
    maxAge: 0,
  });

  return response;
}
