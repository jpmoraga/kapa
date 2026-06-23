"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";

async function fetchTicker(marketId: "btc-clp" | "usdt-clp") {
  const res = await fetch(`/api/buda/ticker?marketId=${marketId}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) return null;
  return res.json();
}

export function HomeMarketTicker() {
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
    <div className="grid gap-3 sm:grid-cols-2">
      <Card variant="elevated" className="rounded-[1.18rem] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold tracking-[0.16em] text-foreground-muted uppercase">
            BTC/CLP
          </div>
          <div className="text-xs text-foreground-muted">spot</div>
        </div>
        <div aria-live="polite" className="mt-2 text-[1.8rem] leading-none font-semibold text-foreground sm:text-[2rem]">
          {btcClp ? `$${Math.round(btcClp).toLocaleString("es-CL")}` : "—"}
          <span className="ml-1 text-base font-normal text-foreground-muted">CLP</span>
        </div>
        <div className="mt-2 text-xs text-foreground-muted">Fuente: Buda</div>
      </Card>

      <Card variant="elevated" className="rounded-[1.18rem] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold tracking-[0.16em] text-foreground-muted uppercase">
            USDT/CLP
          </div>
          <div className="text-xs text-foreground-muted">spot</div>
        </div>
        <div aria-live="polite" className="mt-2 text-[1.8rem] leading-none font-semibold text-foreground sm:text-[2rem]">
          {usdtClp ? `$${Math.round(usdtClp).toLocaleString("es-CL")}` : "—"}
          <span className="ml-1 text-base font-normal text-foreground-muted">CLP</span>
        </div>
        <div className="mt-2 text-xs text-foreground-muted">Fuente: Buda</div>
      </Card>
    </div>
  );
}
