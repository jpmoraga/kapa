import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/Container";

type ServiciosFooterProps = {
  contactEmail: string;
};

export function ServiciosFooter({ contactEmail }: ServiciosFooterProps) {
  return (
    <footer className="border-t border-border/80 pt-6 sm:pt-8">
      <Container
        width="wide"
        className="grid gap-4 px-5 pb-1 sm:gap-5 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:px-8"
      >
        <Link
          href="/"
          className="flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
        >
          <Image
            src="/brand/k21-lockup-dark-tight.svg"
            alt="Kapa21"
            width={365}
            height={53}
            className="h-auto w-[5.8rem] object-contain object-left sm:w-[6rem] lg:w-[6.45rem]"
            unoptimized
          />
        </Link>

        <div className="text-[0.95rem] leading-6 text-foreground-muted sm:text-sm sm:leading-7">
          © {new Date().getFullYear()} Kapa21. Si quieres conversar, escríbenos a {contactEmail}.
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.95rem] text-foreground-muted sm:text-sm">
          <Link
            className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            href="/auth/login"
          >
            Login
          </Link>
          <Link
            className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            href="/auth/register"
          >
            Registro
          </Link>
          <Link
            className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            href="/servicios"
          >
            Servicios
          </Link>
        </div>
      </Container>
    </footer>
  );
}
