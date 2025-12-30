"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BtcClpChart from "@/components/landing/BtcClpChart";

const COMING_SOON = true;

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
    <main className="min-h-screen bg-neutral-800 text-neutral-100">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl border border-neutral-700/60 bg-neutral-900/60 px-3 py-2"
          >
            <Image
              src="/logo/kapa21-symbol.svg"
              alt="Kapa21"
              width={28}
              height={28}
              priority
              className="h-12 w-auto opacity-100"
            />
            <span className="text-base font-medium tracking-[0.22em] text-neutral-200 uppercase">
              Kapa 21
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {COMING_SOON ? (
              <>
                <button
                  title="Sitio en construcción"
                  disabled
                  className="text-sm rounded-lg border border-neutral-700/60 bg-neutral-900/40 px-3 py-2 opacity-60 cursor-not-allowed"
                >
                  Entrar
                </button>

                <button
                  title="Sitio en construcción"
                  disabled
                  className="text-sm rounded-lg bg-white text-black px-3 py-2 font-medium opacity-60 cursor-not-allowed"
                >
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm rounded-lg border border-neutral-700/60 bg-neutral-900/40 px-3 py-2 hover:bg-neutral-800/60"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm rounded-lg bg-white text-black px-3 py-2 font-medium hover:opacity-90"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {COMING_SOON && (
        <div className="mx-auto max-w-6xl px-6 -mt-2 pb-4">
          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-200">
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
              <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 p-4">
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

              <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 p-4">
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
                <button
                  title="Sitio en construcción"
                  disabled
                  className="inline-flex rounded-xl bg-white text-black px-5 py-3 font-medium opacity-60 cursor-not-allowed"
                >
                  Crear cuenta
                </button>
              ) : (
                <Link
                  href="/auth/register"
                  className="inline-flex rounded-xl bg-white text-black px-5 py-3 font-medium hover:opacity-90"
                >
                  Crear cuenta
                </Link>
              )}
            </div>
          </header>

          <section className="lg:col-span-6">
            <div className="rounded-3xl border border-neutral-700/60 bg-neutral-900/40 p-4">
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
          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/35 p-5 min-h-[120px]">
            <div className="text-sm font-medium">Compra & venta</div>
            <div className="mt-1 text-sm text-neutral-400">
              Compra y vende BTC y USDT en CLP con comisiones competitivas. Lleva una bitácora clara: cuánto compraste, a qué precio, en qué fecha y cómo va tu posición.
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/35 p-5 min-h-[120px]">
            <div className="text-sm font-medium">Crédito colateral BTC</div>
            <div className="mt-1 text-sm text-neutral-400">
              Diseñado para obtener liquidez sin vender tu Bitcoin. Reglas claras de colateral, niveles de margen y alertas — habilitado próximamente.
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/35 p-5 min-h-[120px]">
            <div className="text-sm font-medium">Panel & contexto</div>
            <div className="mt-1 text-sm text-neutral-400">
              Define reglas simples: montos, frecuencia, niveles de exposición y objetivos. Un panel para operar con método, no por impulso.
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/70 pt-6 text-xs text-neutral-500">
          <div>© {new Date().getFullYear()} Kapa21</div>

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