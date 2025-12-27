import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    activeCompanyId?: string | null;
    companies?: Array<{
      companyId: string;
      name: string;
      role: string;
    }>;
  }
}