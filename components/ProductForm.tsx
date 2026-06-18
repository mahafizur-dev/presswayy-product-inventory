"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, InventoryRow, RowDraft } from "./../types/inventory";
import { Button, TextField, SelectField, Modal } from "./ui";

type Values = Record<string, string>;

function blankValues(columns: ColumnDef[], row?: InventoryRow): Values {
  const v: Values = {};
  for (const c of columns) {
    if (c.key === "createdAt") continue;
    let raw: unknown;
    if (row) raw = c.custom ? row.attributes?.[c.key] : (row as unknown as Record<string, unknown>)[c.key];
    else raw = c.type === "select" ? c.options?.[0] ?? "" : "";
    v[c.key] = raw === null || raw === undefined ? "" : String(raw);
  }
  return v;
}

export function ProductForm({
  open,
  onClose,
  columns,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  initial?: InventoryRow;
  onSubmit: (draft: RowDraft, existing?: InventoryRow) => Promise<void>;
}) {
  const editable = useMemo(() => columns.filter((c) => c.key !== "createdAt"), [columns]);
  const [values, setValues] = useState<Values>(() => blankValues(columns, initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // reset when opening for a different row
  const formKey = initial?.id ?? "new";
  const [seenKey, setSeenKey] = useState(formKey);
  if (open && seenKey !== formKey) {
    setSeenKey(formKey);
    setValues(blankValues(columns, initial));
    setErrors({});
  }

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    for (const c of editable) {
      const val = values[c.key]?.trim() ?? "";
      if (c.required && !val) e[c.key] = `${c.label} is required.`;
      else if ((c.type === "number" || c.type === "currency") && val && isNaN(Number(val)))
        e[c.key] = "Enter a number.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const defaults: Record<string, unknown> = {};
      const attributes: Record<string, string | number | boolean | null> = {
        ...(initial?.attributes ?? {}),
      };
      for (const c of editable) {
        const raw = values[c.key] ?? "";
        const coerced =
          c.type === "number" || c.type === "currency" ? (raw === "" ? 0 : Number(raw)) : raw;
        if (c.custom) attributes[c.key] = coerced;
        else defaults[c.key] = coerced;
      }
      const draft: RowDraft = {
        name: String(defaults.name ?? ""),
        sku: String(defaults.sku ?? ""),
        category: String(defaults.category ?? ""),
        price: Number(defaults.price ?? 0),
        stock: Number(defaults.stock ?? 0),
        status: (defaults.status as InventoryRow["status"]) ?? "draft",
        attributes,
        ...(initial ? { id: initial.id, createdAt: initial.createdAt } : {}),
      };
      await onSubmit(draft, initial);
      onClose();
    } catch {
      /* toast already shown by store */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit product" : "New product"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Add product"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {editable.map((c) => {
          const span = c.type === "text" && (c.key === "name") ? "sm:col-span-2" : "";
          if (c.type === "select" && c.options) {
            return (
              <div key={c.key} className={span}>
                <SelectField
                  label={c.label}
                  value={values[c.key] ?? ""}
                  error={errors[c.key]}
                  onChange={(e) => set(c.key, e.target.value)}
                  options={c.options.map((o) => ({
                    value: o,
                    label: o.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
                  }))}
                />
              </div>
            );
          }
          return (
            <div key={c.key} className={span}>
              <TextField
                label={c.label + (c.required ? " *" : "")}
                type={c.type === "number" || c.type === "currency" ? "number" : c.type === "date" ? "date" : "text"}
                step={c.type === "currency" ? "0.01" : undefined}
                value={values[c.key] ?? ""}
                error={errors[c.key]}
                onChange={(e) => set(c.key, e.target.value)}
                placeholder={c.custom ? "Custom attribute" : undefined}
              />
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
