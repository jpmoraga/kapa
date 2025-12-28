"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
  CandlestickSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

type TF = "1H" | "6H" | "24H" | "7D";
const TF_SECONDS: Record<TF, number> = {
  "1H": 60 * 60,
  "6H": 6 * 60 * 60,
  "24H": 24 * 60 * 60,
  "7D": 7 * 24 * 60 * 60,
};

// ✅ intervalo de vela por ventana (puedes ajustar después)
const TF_CANDLE_INTERVAL_SEC: Record<TF, number> = {
  "1H": 60,        // velas de 1m
  "6H": 5 * 60,    // velas de 5m
  "24H": 15 * 60,  // velas de 15m
  "7D": 60 * 60,   // velas de 1h
};

type Point = { time: UTCTimestamp; value: number };
type Candle = { time: UTCTimestamp; open: number; high: number; low: number; close: number };

function mergePoints(prev: Point[], next: Point[]) {
  // key por time (si dos trades caen en el mismo segundo, te dejo el último)
  const m = new Map<number, Point>();
  for (const p of prev) m.set(Number(p.time), p);
  for (const p of next) m.set(Number(p.time), p);
  return Array.from(m.values()).sort((a, b) => Number(a.time) - Number(b.time));
}

function buildCandles(points: Point[], intervalSec: number): Candle[] {
  if (points.length === 0) return [];

  // 1) agrupar por bucket
  const buckets = new Map<number, Candle>();

  for (const p of points) {
    const t = Number(p.time);
    const bucket = Math.floor(t / intervalSec) * intervalSec;
    const v = p.value;

    const existing = buckets.get(bucket);
    if (!existing) {
      buckets.set(bucket, {
        time: bucket as UTCTimestamp,
        open: v,
        high: v,
        low: v,
        close: v,
      });
    } else {
      existing.high = Math.max(existing.high, v);
      existing.low = Math.min(existing.low, v);
      existing.close = v;
    }
  }

  const out = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, c]) => c);

  // 2) rellenar huecos (precio constante)
  const filled: Candle[] = [];
  for (let i = 0; i < out.length; i++) {
    filled.push(out[i]);

    const cur = Number(out[i].time);
    const next = i + 1 < out.length ? Number(out[i + 1].time) : null;
    if (next === null) break;

    let t = cur + intervalSec;
    while (t < next) {
      const lastClose = filled[filled.length - 1].close;
      filled.push({
        time: t as UTCTimestamp,
        open: lastClose,
        high: lastClose,
        low: lastClose,
        close: lastClose,
      });
      t += intervalSec;
    }
  }

  return filled;
}

export default function BtcClpChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(false);
  const [tf, setTf] = useState<TF>("24H");
  const [allPoints, setAllPoints] = useState<Point[]>([]);
  const [view, setView] = useState<"candles" | "line">("candles");

  // historia disponible en segundos
  const availableSeconds = useMemo(() => {
    if (allPoints.length < 2) return 0;
    return allPoints[allPoints.length - 1].time - allPoints[0].time;
  }, [allPoints]);

  // puntos dentro de la ventana TF
  const pointsForTf = useMemo(() => {
    if (allPoints.length === 0) return [];
    const end = allPoints[allPoints.length - 1].time;
    const start = end - TF_SECONDS[tf];
    return allPoints.filter((p) => p.time >= start && p.time <= end);
  }, [allPoints, tf]);

  const effectivePoints = useMemo(() => {
    // si no hay suficiente historia para la ventana, usa todo lo que hay
    return pointsForTf.length > 1 ? pointsForTf : allPoints;
  }, [pointsForTf, allPoints]);

  const candlesForTf = useMemo(() => {
    const interval = TF_CANDLE_INTERVAL_SEC[tf];
    return buildCandles(effectivePoints, interval);
  }, [effectivePoints, tf]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/market/line?marketId=btc-clp&limit=500", { cache: "no-store" });
      const json = await res.json();

      if (!json?.ok || !Array.isArray(json.points)) {
        setAllPoints([]);
        lineRef.current?.setData([]);
        candleRef.current?.setData([]);
        return;
      }

      const pts: Point[] = (json.points as any[]).map((p) => ({
        time: Number(p.time) as UTCTimestamp,
        value: Number(p.value),
      }));

      const usable = pts
        .filter((p) => Number.isFinite(Number(p.time)) && Number.isFinite(p.value))
        .sort((a, b) => Number(a.time) - Number(b.time))
        // si hay múltiples trades en el mismo segundo, dejamos el último
        .reduce<Point[]>((acc, p) => {
          const last = acc[acc.length - 1];
          if (!last) return [p];
          if (Number(p.time) === Number(last.time)) {
            acc[acc.length - 1] = p;
            return acc;
          }
          acc.push(p);
          return acc;
        }, []);

      setAllPoints((prev) => mergePoints(prev, usable));

      // crear chart/series UNA sola vez
      if (!chartRef.current && containerRef.current) {
        const chart = createChart(containerRef.current, {
          autoSize: true,
          layout: {
            background: { color: "transparent" },
            textColor: "#e5e5e5",
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          rightPriceScale: {
            borderVisible: false,
            mode: log ? 1 : 0,
          },
          timeScale: {
            borderVisible: false,
            timeVisible: true,
            secondsVisible: false,
          },
          crosshair: { mode: CrosshairMode.Normal },
          localization: {
            locale: "es-CL",
            priceFormatter: (p: number) => Math.round(p).toLocaleString("es-CL"),
          },
        });

        chartRef.current = chart;

        lineRef.current = chart.addSeries(LineSeries, {
          color: "#f7931a",
          lineWidth: 2,
          priceFormat: { type: "price", precision: 0, minMove: 1 },
        });

        candleRef.current = chart.addSeries(CandlestickSeries, {
          // no fijamos colores acá para no pelear con estilos, pero puedes después
          priceFormat: { type: "price", precision: 0, minMove: 1 },
        });

        // por defecto: velas visibles, línea oculta
        lineRef.current.applyOptions({ visible: false });
        candleRef.current.applyOptions({ visible: true });
      }

      // aplicar escala log/lineal
      chartRef.current?.applyOptions({ rightPriceScale: { mode: log ? 1 : 0 } });

      // set data inicial (según view actual)
      if (view === "line") {
        lineRef.current?.setData(effectivePoints);
      } else {
        candleRef.current?.setData(candlesForTf);
      }

      chartRef.current?.timeScale().fitContent();
    } finally {
      setLoading(false);
    }
  }

  // carga inicial
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // log/lineal cambia solo opciones
  useEffect(() => {
    chartRef.current?.applyOptions({ rightPriceScale: { mode: log ? 1 : 0 } });
  }, [log]);

  // cuando cambia TF: re-set data sin refetch
  useEffect(() => {
    if (!chartRef.current) return;
    if (view === "line") {
      lineRef.current?.setData(effectivePoints);
    } else {
      candleRef.current?.setData(candlesForTf);
    }
    chartRef.current.timeScale().fitContent();
  }, [tf, view, effectivePoints, candlesForTf]);

  // switch line/velas
  useEffect(() => {
    if (!lineRef.current || !candleRef.current) return;

    if (view === "line") {
      candleRef.current.applyOptions({ visible: false });
      lineRef.current.applyOptions({ visible: true });
      lineRef.current.setData(effectivePoints);
    } else {
      lineRef.current.applyOptions({ visible: false });
      candleRef.current.applyOptions({ visible: true });
      candleRef.current.setData(candlesForTf);
    }

    chartRef.current?.timeScale().fitContent();
  }, [view, effectivePoints, candlesForTf]);

  // resize
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) {
        chartRef.current?.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const tfs: TF[] = ["1H", "6H", "24H", "7D"];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-neutral-300">BTC / CLP</div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* ✅ selector de vista */}
          <button
            onClick={() => setView("candles")}
            className={[
              "rounded-lg border px-2 py-1 text-xs",
              view === "candles"
                ? "border-neutral-600 bg-neutral-900"
                : "border-neutral-800 bg-black hover:bg-neutral-900",
            ].join(" ")}
            type="button"
          >
            Velas
          </button>
          <button
            onClick={() => setView("line")}
            className={[
              "rounded-lg border px-2 py-1 text-xs",
              view === "line"
                ? "border-neutral-600 bg-neutral-900"
                : "border-neutral-800 bg-black hover:bg-neutral-900",
            ].join(" ")}
            type="button"
          >
            Línea
          </button>

          {/* ✅ timeframes */}
          {tfs.map((x) => {
            const enabled = availableSeconds >= TF_SECONDS[x];
            return (
              <button
                key={x}
                onClick={() => enabled && setTf(x)}
                disabled={!enabled}
                className={[
                  "rounded-lg border px-2 py-1 text-xs",
                  tf === x
                    ? "border-neutral-600 bg-neutral-900"
                    : "border-neutral-800 bg-black hover:bg-neutral-900",
                  !enabled ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
                type="button"
                title={!enabled ? "No hay historia suficiente todavía" : ""}
              >
                {x}
              </button>
            );
          })}

          <button
            onClick={() => setLog(!log)}
            className="rounded-lg border border-neutral-800 bg-black px-2 py-1 text-xs hover:bg-neutral-900"
            type="button"
          >
            {log ? "Log" : "Lineal"}
          </button>
        </div>
      </div>

      <div className="mt-3 h-[240px] w-full" ref={containerRef} />

      <div className="mt-2 text-xs text-neutral-500">
        {loading
          ? "Cargando…"
          : `Fuente: Buda (trades btc-clp) · Vista: ${view === "candles" ? "Velas" : "Línea"} · Ventana: ${tf} · Historia: ${Math.max(
              0,
              Math.floor(availableSeconds / 3600)
            )}h`}
      </div>
    </div>
  );
}