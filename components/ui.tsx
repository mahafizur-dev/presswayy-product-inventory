"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type BtnVariant = "primary" | "ghost" | "danger" | "subtle";

export function Button({
  variant = "subtle",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium px-3.5 h-9 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-[var(--amber)] text-[#1a1205] hover:bg-[var(--amber-press)] font-semibold",
    ghost: "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]",
    danger: "text-[var(--bad)] hover:bg-[var(--bad)]/10",
    subtle:
      "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--line)] border border-[var(--line)]",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function TextField({
  label,
  error,
  hint,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">{label}</span>
      )}
      <input
        className={`w-full h-10 rounded-md bg-[var(--bg)] border px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] transition-colors focus:border-[var(--amber)] ${
          error ? "border-[var(--bad)]" : "border-[var(--line)]"
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs text-[var(--bad)]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--text-faint)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function SelectField({
  label,
  error,
  options,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">{label}</span>
      )}
      <select
        className={`w-full h-10 rounded-md bg-[var(--bg)] border px-3 text-sm text-[var(--text)] transition-colors focus:border-[var(--amber)] ${
          error ? "border-[var(--bad)]" : "border-[var(--line)]"
        } ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-[var(--bad)]">{error}</span>}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-lg rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
