"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
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

type Point = { time: UTCTimestamp; value: number };

export default function BtcClpChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);

  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(false);
  const [tf, setTf] = useState<TF>("24H");
  const [allPoints, setAllPoints] = useState<Point[]>([]);

  // historia disponible en segundos (según lo que llegó)
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

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/market/line?marketId=btc-clp&limit=500",
        { cache: "no-store" }
      );
      const json = await res.json();

      if (!json?.ok || !Array.isArray(json.points)) {
        setAllPoints([]);
        lineRef.current?.setData([]);
        return;
      }

      const pts: Point[] = (json.points as any[]).map((p) => ({
        time: Number(p.time) as UTCTimestamp,
        value: Number(p.value),
      }));
      
      const usable = pts
        .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value))
        .sort((a, b) => a.time - b.time)
        .filter((p, i, arr) => i === 0 || p.time > arr[i - 1].time);

      setAllPoints(usable);

      // crear chart/serie UNA sola vez
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
            mode: log ? 1 : 0, // 0 normal, 1 log
          },
          timeScale: {
            borderVisible: false,
            timeVisible: true,
            secondsVisible: false,
          },
          crosshair: { mode: CrosshairMode.Normal },
          localization: {
            locale: "es-CL",
            priceFormatter: (p: number) =>
              Math.round(p).toLocaleString("es-CL"),
          },
        });

        chartRef.current = chart;
        lineRef.current = chart.addSeries(LineSeries, {
          color: "#f7931a",
          lineWidth: 2,
          priceFormat: { type: "price", precision: 0, minMove: 1 },
        });
      }

      // aplicar escala log/lineal
      chartRef.current?.applyOptions({
        rightPriceScale: { mode: log ? 1 : 0 },
      });

      // al cargar: muestra la ventana del TF si existe, si no muestra todo lo que hay
      const end = usable.length ? usable[usable.length - 1].time : 0;
      const start = end - TF_SECONDS[tf];
      const windowPts = usable.filter((p) => p.time >= start && p.time <= end);
      const initial = windowPts.length ? windowPts : usable;

      lineRef.current?.setData(initial);
      chartRef.current?.timeScale().fitContent();
    } finally {
      setLoading(false);
    }
  }

  // carga inicial y refresca cuando cambia log (sin refetch si ya existe chart)
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        rightPriceScale: { mode: log ? 1 : 0 },
      });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log]);

  // cuando cambia TF: solo re-set data (NO refetch)
  useEffect(() => {
    if (!lineRef.current) return;

    // si no hay suficientes datos para ese TF, no reventamos: dejamos lo que hay
    if (pointsForTf.length > 1) {
      lineRef.current.setData(pointsForTf);
      chartRef.current?.timeScale().fitContent();
    } else {
      // fallback: muestra todo lo disponible
      lineRef.current.setData(allPoints);
      chartRef.current?.timeScale().fitContent();
    }
  }, [pointsForTf, allPoints]);

  // resize
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) {
        chartRef.current?.applyOptions({
          width: containerRef.current.clientWidth,
        });
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
          {tfs.map((x) => {
            // habilita SOLO si hay historia suficiente
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
          : `Fuente: Buda (trades btc-clp) · Ventana: ${tf} · Historia: ${Math.max(
              0,
              Math.floor(availableSeconds / 3600)
            )}h`}
      </div>
    </div>
  );
}