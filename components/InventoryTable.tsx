"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, InventoryRow } from "@/types/inventory";
import { Cell } from "./Cell";
import { Button } from "./ui";
import {
  Pencil,
  Trash2,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type SortDir = "asc" | "desc";

function valueFor(row: InventoryRow, col: ColumnDef): unknown {
  return col.custom
    ? row.attributes?.[col.key]
    : (row as unknown as Record<string, unknown>)[col.key];
}

export function InventoryTable({
  rows,
  columns,
  query,
  onEdit,
  onDelete,
  onRemoveColumn,
}: {
  rows: InventoryRow[];
  columns: ColumnDef[];
  query: string;
  onEdit: (row: InventoryRow) => void;
  onDelete: (row: InventoryRow) => void;
  onRemoveColumn: (key: string) => void;
}) {
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((r) => {
        const haystack = [
          r.unique_product_id,
          r.product_name,
          r.category,
          r.description,
          r.size,
          r.color,
          ...Object.values(r.attributes ?? {}).map((v) => String(v ?? "")),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    // No sort column selected → keep the order rows arrive in (DB FIFO order).
    const col = sortKey ? columns.find((c) => c.key === sortKey) : undefined;
    if (!col) return list;
    const sorted = [...list].sort((a, b) => {
      const av = valueFor(a, col);
      const bv = valueFor(b, col);
      if (col.type === "number" || col.type === "currency") {
        return Number(av ?? 0) - Number(bv ?? 0);
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
        numeric: true,
      });
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [rows, query, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)]">
            {columns.map((col) => {
              const active = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  className={`group sticky top-0 whitespace-nowrap bg-[var(--surface)] px-4 py-3 text-left ${col.width ?? ""}`}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)] hover:text-[var(--text)]"
                    >
                      {col.label}
                      {active ? (
                        sortDir === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown
                          size={12}
                          className="opacity-0 group-hover:opacity-50"
                        />
                      )}
                    </button>
                    {col.custom && (
                      <button
                        onClick={() => onRemoveColumn(col.key)}
                        aria-label={`Remove ${col.label} column`}
                        title="Remove column"
                        className="rounded p-0.5 text-[var(--text-faint)] opacity-0 hover:text-[var(--bad)] group-hover:opacity-100"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
            <th className="sticky right-0 top-0 z-20 bg-[var(--surface)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)] shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr
              key={row.id}
              className="group border-b border-[var(--line-soft)] transition-colors last:border-0 hover:bg-[var(--surface-2)]/60"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 align-middle ${col.width ?? ""}`}
                >
                  <Cell row={row} col={col} />
                </td>
              ))}
              <td className="sticky right-0 z-10 bg-[var(--surface)] px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)] transition-colors group-hover:bg-[var(--surface-2)]">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(row)}
                    aria-label="Edit"
                    className="rounded-md p-1.5 text-[var(--text-dim)] hover:bg-[var(--line)] hover:text-[var(--text)]"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    aria-label="Delete"
                    className="rounded-md p-1.5 text-[var(--text-dim)] hover:bg-[var(--bad)]/15 hover:text-[var(--bad)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-1 px-4 py-16 text-center">
          <p className="text-sm font-medium text-[var(--text)]">
            {query ? "No products match your search." : "No products yet."}
          </p>
          <p className="text-sm text-[var(--text-dim)]">
            {query
              ? "Try a different term."
              : "Add your first product to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
