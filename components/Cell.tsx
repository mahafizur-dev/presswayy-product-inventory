"use client";

import type { ColumnDef, InventoryRow } from "./../types/inventory";
import { STATUS_LABELS } from "./../types/inventory";

function rawValue(row: InventoryRow, col: ColumnDef): unknown {
  return col.custom
    ? row.attributes?.[col.key]
    : (row as unknown as Record<string, unknown>)[col.key];
}

const STATUS_COLOR: Record<string, string> = {
  active: "var(--ok)",
  draft: "var(--neutral)",
  archived: "var(--text-faint)",
  out_of_stock: "var(--bad)",
};

export function StatusPill({ status }: { status: InventoryRow["status"] }) {
  const color = STATUS_COLOR[status] ?? "var(--neutral)";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span style={{ color }}>{STATUS_LABELS[status] ?? status}</span>
    </span>
  );
}

export function Cell({ row, col }: { row: InventoryRow; col: ColumnDef }) {
  const v = rawValue(row, col);

  if (col.key === "status") return <StatusPill status={row.status} />;

  if (v === null || v === undefined || v === "") {
    return <span className="text-[var(--text-faint)]">—</span>;
  }

  switch (col.type) {
    case "currency":
      return (
        <span className="mono text-[var(--text)]">
          ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      );
    case "number":
      return <span className="mono text-[var(--text)]">{Number(v).toLocaleString()}</span>;
    case "date": {
      const d = new Date(String(v));
      return (
        <span className="mono text-[var(--text-dim)]">
          {isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </span>
      );
    }
    case "boolean":
      return <span>{v ? "Yes" : "No"}</span>;
    default:
      // SKU-like keys get the mono treatment for ledger alignment
      return (
        <span className={col.key === "sku" ? "mono text-[var(--text-dim)]" : "text-[var(--text)]"}>
          {String(v)}
        </span>
      );
  }
}
