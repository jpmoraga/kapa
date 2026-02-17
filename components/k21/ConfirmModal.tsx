"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => {
        confirmRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(id);
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
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/95 p-6 shadow-xl backdrop-blur">
        <div className="text-lg font-semibold text-white">{title}</div>
        {description ? (
          <div className="mt-2 text-sm text-neutral-300">{description}</div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${confirmTone} ${
              loading ? "opacity-60" : ""
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
