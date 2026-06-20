"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, InventoryRow, RowDraft } from "@/types/inventory";
import { Button, TextField, SelectField, Modal } from "./ui";

type Values = Record<string, string>;

const normKey = (k: string) =>
  String(k || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

function attrValue(
  attrs: Record<string, unknown> | undefined,
  key: string,
): unknown {
  if (!attrs) return undefined;
  if (attrs[key] !== undefined) return attrs[key];
  const target = normKey(key);
  for (const [k, val] of Object.entries(attrs)) {
    if (normKey(k) === target) return val;
  }
  return undefined;
}

function blankValues(columns: ColumnDef[], row?: InventoryRow): Values {
  const v: Values = {};
  for (const c of columns) {
    let raw: unknown;
    if (row) {
      raw = c.custom
        ? attrValue(row.attributes, c.key)
        : (row as unknown as Record<string, unknown>)[c.key];
    } else raw = c.type === "select" ? (c.options?.[0] ?? "") : "";
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
  const editable = useMemo(() => columns, [columns]);
  const [values, setValues] = useState<Values>(() =>
    blankValues(columns, initial),
  );
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
      else if (
        (c.type === "number" || c.type === "currency") &&
        val &&
        isNaN(Number(val))
      )
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
      // Build attributes ONLY from the actual custom columns — do not spread
      // the previous attributes blob, which can contain junk/system keys
      // (createdAt, Attributes, etc.) that otherwise re-nest on every edit.
      const attributes: Record<string, string | number | boolean | null> = {};
      for (const c of editable) {
        const raw = values[c.key] ?? "";
        const coerced =
          c.type === "number" || c.type === "currency"
            ? raw === ""
              ? 0
              : Number(raw)
            : raw;
        if (c.custom) attributes[c.key] = coerced;
        else defaults[c.key] = coerced;
      }
      const draft: RowDraft = {
        unique_product_id: String(defaults.unique_product_id ?? ""),
        product_name: String(defaults.product_name ?? ""),
        category: String(defaults.category ?? ""),
        description: String(defaults.description ?? ""),
        size: String(defaults.size ?? ""),
        color: String(defaults.color ?? ""),
        regular_price: Number(defaults.regular_price ?? 0),
        offer_price: Number(defaults.offer_price ?? 0),
        image_url: String(defaults.image_url ?? ""),
        inventory_quantity: Number(defaults.inventory_quantity ?? 0),
        attributes,
        ...(initial ? { id: initial.id } : {}),
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
          const span =
            c.type === "text" &&
            (c.key === "product_name" ||
              c.key === "description" ||
              c.key === "image_url")
              ? "sm:col-span-2"
              : "";
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
                    label: o
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (m) => m.toUpperCase()),
                  }))}
                />
              </div>
            );
          }
          return (
            <div key={c.key} className={span}>
              <TextField
                label={c.label + (c.required ? " *" : "")}
                type={
                  c.type === "number" || c.type === "currency"
                    ? "number"
                    : c.type === "date"
                      ? "date"
                      : "text"
                }
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
