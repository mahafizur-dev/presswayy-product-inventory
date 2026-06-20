"use client";

import type { ColumnDef, InventoryRow } from "@/types/inventory";

/** Normalize a key for tolerant matching: lowercase, strip non-alphanumerics. */
function normKey(k: string): string {
  return String(k || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function rawValue(row: InventoryRow, col: ColumnDef): unknown {
  if (!col.custom) {
    return (row as unknown as Record<string, unknown>)[col.key];
  }
  const attrs = row.attributes ?? {};
  // 1. exact key
  if (attrs[col.key] !== undefined) return attrs[col.key];
  // 2. tolerant match (handles vats vs Vats vs "Vats" prettified by backend)
  const target = normKey(col.key);
  for (const [k, val] of Object.entries(attrs)) {
    if (normKey(k) === target) return val;
  }
  return undefined;
}

export function Cell({ row, col }: { row: InventoryRow; col: ColumnDef }) {
  const v = rawValue(row, col);

  if (v === null || v === undefined || v === "") {
    return <span className="text-[var(--text-faint)]">—</span>;
  }

  switch (col.type) {
    case "currency":
      return (
        <span className="mono text-[var(--text)]">
          ৳{Number(v).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
        </span>
      );
    case "number":
      return (
        <span className="mono text-[var(--text)]">
          {Number(v).toLocaleString()}
        </span>
      );
    case "date": {
      const d = new Date(String(v));
      return (
        <span className="mono text-[var(--text-dim)]">
          {isNaN(d.getTime())
            ? String(v)
            : d.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
        </span>
      );
    }
    case "boolean":
      return <span>{v ? "Yes" : "No"}</span>;
    default: {
      // The product-id and image-url columns read better in mono / dimmed.
      const isMono = col.key === "unique_product_id" || col.key === "image_url";
      return (
        <span
          className={
            isMono
              ? "mono text-[var(--text-dim)] block max-w-[20rem] truncate"
              : "text-[var(--text)] block max-w-[24rem] truncate"
          }
          title={String(v)}
        >
          {String(v)}
        </span>
      );
    }
  }
}
