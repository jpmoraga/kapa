import Link from "next/link";

type LandingFooterProps = {
  comingSoon?: boolean;
};

export function LandingFooter({ comingSoon = false }: LandingFooterProps) {
  return (
    <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/50 pt-6 text-xs text-neutral-500">
      <div>© {new Date().getFullYear()} Kapa21</div>
      <div>Si quieres conversar, escríbenos: contacto@kapa21.cl</div>
      <div className="flex items-center gap-3">
        {comingSoon ? (
          <>
            <span title="Sitio en construcción" className="opacity-60 cursor-not-allowed">
              Login
            </span>
            <span title="Sitio en construcción" className="opacity-60 cursor-not-allowed">
              Registro
            </span>
            <span title="Sitio en construcción" className="opacity-60 cursor-not-allowed">
              Servicios
            </span>
          </>
        ) : (
          <>
            <Link className="hover:text-neutral-300" href="/auth/login">
              Login
            </Link>
            <Link className="hover:text-neutral-300" href="/auth/register">
              Registro
            </Link>
            <Link className="hover:text-neutral-300" href="/servicios">
              Servicios
            </Link>
          </>
        )}
      </div>
    </footer>
  );
}
