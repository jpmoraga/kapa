import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/Container";
import { Button } from "@/components/ui/Button";

export function ServiciosHeader() {
  return (
    <Container width="wide" className="px-5 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-5">
        <Link
          href="/"
          className="flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
        >
          <Image
            src="/brand/k21-lockup-white-tight.svg"
            alt="Kapa21"
            width={365}
            height={53}
            priority
            className="h-auto w-[6.55rem] object-contain object-left sm:w-[6.95rem] lg:w-[7.75rem]"
            unoptimized
          />
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
          <nav className="hidden lg:flex lg:items-center lg:gap-3 lg:text-sm lg:text-foreground-muted" aria-label="Navegación principal">
            <Link
              href="/"
              className="rounded-full px-3 py-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Inicio
            </Link>
          </nav>

          <Link
            href="/auth/login"
            className="inline-flex min-h-10 items-center justify-center rounded-full px-3 text-[0.92rem] font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:min-h-11 sm:px-4 sm:text-sm"
          >
            Entrar
          </Link>
          <Button
            href="/auth/register"
            variant="primary"
            className="min-h-10 rounded-full px-3.5 text-[0.92rem] sm:min-h-11 sm:px-4 sm:text-sm"
          >
            Crear cuenta
          </Button>
        </div>
      </div>
    </Container>
  );
}
