"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BtcClpChart from "@/components/landing/BtcClpChart";

const COMING_SOON = false;

async function fetchTicker(marketId: "btc-clp" | "usdt-clp") {
  const res = await fetch(`/api/buda/ticker?marketId=${marketId}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function LandingPage() {
  const [btcClp, setBtcClp] = useState<number | null>(null);
  const [usdtClp, setUsdtClp] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    const loadPrices = async () => {
      try {
        const [btc, usdt] = await Promise.all([
          fetchTicker("btc-clp"),
          fetchTicker("usdt-clp"),
        ]);

        if (!alive) return;

        setBtcClp(Number(btc?.last_price) || null);
        setUsdtClp(Number(usdt?.last_price) || null);
      } catch {
        if (!alive) return;
        setBtcClp(null);
        setUsdtClp(null);
      }
    };

    loadPrices();
    const intervalId = setInterval(loadPrices, 15000);

    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="min-h-screen text-neutral-100 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(247,147,26,0.12),transparent_45%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,1))]">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/k21-lockup-white.svg"
              alt="Kapa 21"
              width={420}
              height={120}
              priority
              className="h-24 sm:h-28 md:h-32 w-auto"
            />
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {COMING_SOON ? (
              <>
                <button title="Sitio en construcción" disabled className="k21-btn-disabled">
                  Entrar
                </button>
                <button title="Sitio en construcción" disabled className="k21-btn-disabled">
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="k21-btn-secondary">
                  Entrar
                </Link>
                <Link href="/auth/register" className="k21-btn-primary">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {COMING_SOON && (
        <div className="mx-auto max-w-6xl px-6 -mt-2 pb-4">
          <div className="k21-card px-4 py-3 text-sm text-neutral-200">
            🚧 Sitio en construcción — estamos afinando la experiencia. Vuelve pronto.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <header className="lg:col-span-6">
          <h1 className="text-5xl font-semibold tracking-tight text-neutral-50">
            Bitcoin en simple.
          </h1>

            <p className="mt-4 text-neutral-300 text-lg max-w-xl">
              Compra, vende y gestiona tu posición en BTC.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 max-w-xl">
              <div className="k21-card p-4">
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

              <div className="k21-card p-4">
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
              {COMING_SOON ? (
                <button title="Sitio en construcción" disabled className="k21-btn-disabled inline-flex px-5 py-3">
                Crear cuenta
                </button>
              ) : (
                <Link href="/auth/register" className="k21-btn-primary inline-flex px-5 py-3">
                  Crear cuenta
                </Link>
              )}
            </div>
          </header>

          <section className="lg:col-span-6">
            <div className="k21-card p-4">
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

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="k21-card p-5 min-h-[120px]">
            <div className="text-sm font-medium">Compra & venta</div>
            <div className="mt-1 text-sm text-neutral-400">
              Compra y vende BTC y USDT en CLP con comisiones competitivas. Lleva una bitácora clara: cuánto compraste, a qué precio, en qué fecha y cómo va tu posición.
            </div>
          </div>
          <div className="k21-card p-5 min-h-[120px]">
            <div className="text-sm font-medium">Crédito colateral BTC</div>
            <div className="mt-1 text-sm text-neutral-400">
              Diseñado para obtener liquidez sin vender tu Bitcoin. Reglas claras de colateral, niveles de margen y alertas — habilitado próximamente.
            </div>
          </div>
          <div className="k21-card p-5 min-h-[120px]">
            <div className="text-sm font-medium">Panel & contexto</div>
            <div className="mt-1 text-sm text-neutral-400">
              Define reglas simples: montos, frecuencia, niveles de exposición y objetivos. Un panel para operar con método, no por impulso.
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/50 pt-6 text-xs text-neutral-500">
          <div>© {new Date().getFullYear()} Kapa21</div>

          <div>Contacto: contacto@kapa21.cl</div>

          <div className="flex items-center gap-3">
            {COMING_SOON ? (
              <>
                <span title="Sitio en construcción" className="opacity-60 cursor-not-allowed">
                  Login
                </span>
                <span title="Sitio en construcción" className="opacity-60 cursor-not-allowed">
                  Registro
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
              </>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
