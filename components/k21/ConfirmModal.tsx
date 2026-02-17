"use client";

import { useEffect, useMemo, useRef } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "neutral" | "danger" | "success";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "neutral",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useMemo(() => `k21-confirm-title-${Math.random().toString(36).slice(2)}`, []);
  const descId = useMemo(() => `k21-confirm-desc-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      const id = window.setTimeout(() => {
        confirmRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(id);
    }
    if (!open && openerRef.current) {
      const el = openerRef.current;
      openerRef.current = null;
      window.setTimeout(() => el.focus(), 0);
    }
    return;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (loading) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const confirmTone =
    tone === "danger"
      ? "border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20"
      : tone === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
      : "border-white/10 bg-white/5 text-white hover:bg-white/10";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(event) => {
        if (loading) return;
        if (event.target !== event.currentTarget) return;
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      {...(description ? { "aria-describedby": descId } : {})}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/95 p-6 shadow-xl backdrop-blur">
        <div id={titleId} className="text-lg font-semibold text-white">
          {title}
        </div>
        {description ? (
          <div id={descId} className="mt-2 text-sm text-neutral-300">
            {description}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            ref={cancelRef}
            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
            onClick={onClose}
            disabled={loading}
            onKeyDown={(event) => {
              if (event.key !== "Tab" || !event.shiftKey) return;
              event.preventDefault();
              confirmRef.current?.focus();
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={`min-w-[120px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${confirmTone} ${
              loading ? "opacity-60" : ""
            }`}
            onClick={onConfirm}
            disabled={loading}
            onKeyDown={(event) => {
              if (event.key !== "Tab" || event.shiftKey) return;
              event.preventDefault();
              cancelRef.current?.focus();
            }}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
