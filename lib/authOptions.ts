// web/lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],

  pages: { signIn: "/auth/login" },

  callbacks: {
    async jwt({ token, user }) {
      const userId = (user as any)?.id ?? token.sub;
      if (!userId) return token;

      const memberships = await prisma.companyUser.findMany({
        where: { userId },
        include: { company: { select: { id: true, name: true } } },
        orderBy: { companyId: "asc" },
      });

      const companies = memberships.map((m) => ({
        companyId: m.companyId,
        name: m.company.name,
        role: m.role,
      }));

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { activeCompanyId: true },
      });

      (token as any).userId = userId;
      (token as any).companies = companies;
      (token as any).activeCompanyId = dbUser?.activeCompanyId ?? null;

      return token;
    },

    async session({ session, token }) {
      (session.user as any).id = (token as any).userId ?? null;
      (session as any).companies = (token as any).companies ?? [];
      (session as any).activeCompanyId = (token as any).activeCompanyId ?? null;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};