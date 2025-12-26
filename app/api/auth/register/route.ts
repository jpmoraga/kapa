import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  const body = await req.json();

  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");
  const companyName = String(body.companyName ?? "").trim();

  if (!email || !password || !companyName) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      companyUsers: {
        create: {
          role: "owner",
          company: {
            create: {
              name: companyName,
              treasury: {
                create: { balance: 0 },
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      companyUsers: {
        select: { companyId: true },
        take: 1,
      },
    },
  });

  const companyId = user.companyUsers[0]?.companyId ?? null;

  return NextResponse.json({ ok: true, userId: user.id, companyId });
}