import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kapa21 Backoffice",
  description: "Backoffice comercial privado de Kapa21",
};

export default function BackofficeRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
