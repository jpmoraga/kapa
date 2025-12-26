import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, rut, phone } = body;

  if (!fullName || !rut || !phone) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.personProfile.create({
    data: {
      userId: user.id,
      fullName,
      rut,
      phone,
    },
  });

  return NextResponse.json({ ok: true });
}