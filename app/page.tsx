// app/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import BtcClpChart from "@/components/landing/BtcClpChart";


async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function getPrice(pair: "BTC_CLP" | "USDT_CLP") {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/prices/current?pair=${pair}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return Number(json?.price) || null;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const [btcClp, usdtClp] = await Promise.all([
    getPrice("BTC_CLP"),
    getPrice("USDT_CLP"),
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">Kapa</div>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="text-sm rounded-lg border border-neutral-800 px-3 py-2 hover:bg-neutral-900"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="text-sm rounded-lg bg-white text-black px-3 py-2 font-medium hover:opacity-90"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <header className="lg:col-span-6">
            <h1 className="text-5xl font-semibold tracking-tight">Kapa</h1>

            <p className="mt-4 text-neutral-300 text-lg max-w-xl">
              Compra, vende y gestiona tu tesorería en Bitcoin.
            </p>

            {/* Spot cards */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2 max-w-xl">
              <div className="rounded-2xl border border-neutral-800 bg-black/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-400">BTC/CLP</div>
                  <div className="text-xs text-neutral-500">spot</div>
                </div>
                <div className="mt-2 text-3xl font-semibold">
                  {btcClp ? `$${Math.round(btcClp).toLocaleString("es-CL")}` : "—"}
                  <span className="text-base font-normal text-neutral-400"> CLP</span>
                </div>
                <div className="mt-2 text-xs text-neutral-500">Fuente: Buda</div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-black/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-400">USDT/CLP</div>
                  <div className="text-xs text-neutral-500">spot</div>
                </div>
                <div className="mt-2 text-3xl font-semibold">
                  {usdtClp ? `$${Math.round(usdtClp).toLocaleString("es-CL")}` : "—"}
                  <span className="text-base font-normal text-neutral-400"> CLP</span>
                </div>
                <div className="mt-2 text-xs text-neutral-500">Fuente: Buda</div>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/register"
                className="inline-flex rounded-xl bg-white text-black px-5 py-3 font-medium hover:opacity-90"
              >
                Crear cuenta
              </Link>
            </div>
          </header>

          {/* Chart card */}
          <section className="lg:col-span-6">
            <div className="rounded-3xl border border-neutral-800 bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-200">BTC / CLP</div>
                  <div className="text-xs text-neutral-500">Gráfico (últimos trades)</div>
                </div>
                <div className="text-xs text-neutral-500">Landing MVP</div>
              </div>

              <BtcClpChart />
            </div>
          </section>
        </div>

        {/* Benefits */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-black/20 p-4">
            <div className="text-sm font-medium">Bitcoin-first</div>
            <div className="mt-1 text-sm text-neutral-400">
              Todo gira en torno a BTC, no a “cripto” genérico.
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-black/20 p-4">
            <div className="text-sm font-medium">Simple</div>
            <div className="mt-1 text-sm text-neutral-400">
              Compra y venta con una experiencia limpia.
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-black/20 p-4">
            <div className="text-sm font-medium">Listo para tesorería</div>
            <div className="mt-1 text-sm text-neutral-400">
              Personas hoy, empresas mañana, sin rehacer todo.
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-900 pt-6 text-xs text-neutral-500">
          <div>© {new Date().getFullYear()} Kapa</div>
          <div className="flex items-center gap-3">
            <Link className="hover:text-neutral-300" href="/auth/login">
              Login
            </Link>
            <Link className="hover:text-neutral-300" href="/auth/register">
              Registro
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}