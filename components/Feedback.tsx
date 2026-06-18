"use client";

import { Button, Modal } from "./ui";
import { useInventory } from "./../store/inventory";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ConfirmDelete({
  open,
  productName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  productName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete product"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="primary"
            className="!bg-[var(--bad)] !text-white hover:!bg-[#d15a45]"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--text-dim)]">
        <span className="font-medium text-[var(--text)]">{productName || "This product"}</span> will
        be removed from the inventory. This can’t be undone.
      </p>
    </Modal>
  );
}

export function Toasts() {
  const toasts = useInventory((s) => s.toasts);
  const dismiss = useInventory((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm shadow-xl"
        >
          {t.kind === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--ok)]" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-[var(--bad)]" />
          )}
          <span className="text-[var(--text)]">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
