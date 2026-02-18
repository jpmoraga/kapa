export const LTV_SEGMENTS = [
  { from: 0, to: 40, cls: "bg-sky-500/20" },
  { from: 40, to: 65, cls: "bg-emerald-500/20" },
  { from: 65, to: 70, cls: "bg-orange-500/25" },
  { from: 70, to: 80, cls: "bg-amber-500/25" },
  { from: 80, to: 100, cls: "bg-red-500/25" },
] as const;

export const LTV_MARKERS = [40, 65, 70, 80] as const;

export function ltvBadge(ltvPct: number | null) {
  if (ltvPct === null || !Number.isFinite(ltvPct)) {
    return { label: "—", cls: "border-white/10 bg-white/5 text-neutral-400" };
  }
  if (ltvPct > 80) {
    return { label: "Liquidación", cls: "border-red-500/30 bg-red-500/10 text-red-300" };
  }
  if (ltvPct >= 70) {
    return { label: "Margin call", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" };
  }
  if (ltvPct >= 65) {
    return { label: "Riesgo", cls: "border-orange-500/30 bg-orange-500/10 text-orange-300" };
  }
  if (ltvPct >= 40) {
    return { label: "Saludable", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
  }
  return { label: "Retiro posible", cls: "border-sky-500/30 bg-sky-500/10 text-sky-300" };
}

export function ltvTone(ltvPct: number | null) {
  if (ltvPct === null || !Number.isFinite(ltvPct)) {
    return {
      fillCls: "bg-white/5",
      dotCls: "border-white/20 bg-white/5",
      markerCls: "bg-white/40",
    };
  }
  if (ltvPct > 80) {
    return {
      fillCls: "bg-red-500/25",
      dotCls: "border-red-500/40 bg-red-500/20",
      markerCls: "bg-red-500/60",
    };
  }
  if (ltvPct >= 70) {
    return {
      fillCls: "bg-amber-500/25",
      dotCls: "border-amber-500/40 bg-amber-500/20",
      markerCls: "bg-amber-500/60",
    };
  }
  if (ltvPct >= 65) {
    return {
      fillCls: "bg-orange-500/25",
      dotCls: "border-orange-500/40 bg-orange-500/20",
      markerCls: "bg-orange-500/60",
    };
  }
  if (ltvPct >= 40) {
    return {
      fillCls: "bg-emerald-500/20",
      dotCls: "border-emerald-500/40 bg-emerald-500/20",
      markerCls: "bg-emerald-500/60",
    };
  }
  return {
    fillCls: "bg-sky-500/20",
    dotCls: "border-sky-500/40 bg-sky-500/20",
    markerCls: "bg-sky-500/60",
  };
}
