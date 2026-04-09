"use client";

import { ReactNode, useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Annuler",
  tone = "default",
  busy = false,
  confirmDisabled = false,
  children,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onCancel, open]);

  if (!open) {
    return null;
  }

  const confirmButtonClass =
    tone === "danger"
      ? "bg-hot text-white hover:bg-hot/90"
      : "bg-accent text-white hover:bg-accent/90";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-void/80 p-4 backdrop-blur-sm md:items-center">
      <button
        aria-label="Fermer la confirmation"
        className="absolute inset-0 cursor-default"
        disabled={busy}
        onClick={onCancel}
        type="button"
      />
      <div className="relative z-10 w-full max-w-lg rounded-[1.75rem] border border-border bg-surface p-6 shadow-2xl">
        <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${tone === "danger" ? "text-hot" : "text-accent-light"}`}>
          Confirmation
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-text">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>

        {children && (
          <div className="mt-4 rounded-2xl border border-border bg-elevated/50 px-4 py-4 text-sm text-text-muted">
            {children}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="ghost-button w-full sm:w-auto"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`signal-button w-full sm:w-auto ${confirmButtonClass}`}
            disabled={busy || confirmDisabled}
            onClick={onConfirm}
            type="button"
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
