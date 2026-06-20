"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useInventory } from "../../../store/inventory";
import { DEFAULT_COLUMNS } from "../../../types/inventory";
import type { InventoryRow, RowDraft } from "../../../types/inventory";
import { InventoryTable } from "../../../components/InventoryTable";
import { ProductForm } from "../../../components/ProductForm";
import { AddColumnDialog } from "../../../components/AddColumnDialog";
import { ConfirmDelete, Toasts } from "../../../components/Feedback";
import { Button } from "../../../components/ui";
import { Plus, Columns3, Search, RefreshCw, Boxes } from "lucide-react";

export default function InventoryPage() {
  // company scope from the URL: /[companyId]/inventory
  const params = useParams();
  const companyId = Array.isArray(params.companyId)
    ? params.companyId[0]
    : ((params.companyId as string | undefined) ?? "");

  // store
  const rows = useInventory((s) => s.rows);
  const loading = useInventory((s) => s.loading);
  const error = useInventory((s) => s.error);
  const customColumns = useInventory((s) => s.customColumns);
  const { setCompany, load, addRow, editRow, deleteRow, removeColumn } =
    useInventory();

  // local ui state
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [colOpen, setColOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | undefined>();
  const [deleting, setDeleting] = useState<InventoryRow | undefined>();

  // derived
  const columns = useMemo(
    () => [...DEFAULT_COLUMNS, ...customColumns],
    [customColumns],
  );

  const stats = useMemo(() => {
    let totalUnits = 0;
    let value = 0;
    let low = 0;
    let out = 0;
    for (const r of rows) {
      const qty = r.inventory_quantity || 0;
      const unitPrice = r.offer_price || r.regular_price || 0;
      totalUnits += qty;
      value += unitPrice * qty;
      if (qty > 0 && qty <= 5) low++;
      if (qty === 0) out++;
    }
    return { count: rows.length, totalUnits, value, low, out };
  }, [rows]);

  useEffect(() => {
    if (!companyId) return;
    setCompany(companyId);
    load();
  }, [companyId, setCompany, load]);

  // handlers
  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (row: InventoryRow) => {
    setEditing(row);
    setFormOpen(true);
  };
  const confirmDelete = () => {
    if (deleting) deleteRow(deleting.id);
  };
  const handleSubmit = async (draft: RowDraft, existing?: InventoryRow) => {
    if (existing) await editRow({ ...existing, ...draft } as InventoryRow);
    else await addRow(draft);
  };

  const showEmptyLoader = loading && rows.length === 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--amber)]">
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              Product inventory
            </h1>
            <p className="text-sm text-[var(--text-dim)]">
              {stats.count} products · {stats.totalUnits.toLocaleString()} units
              on hand
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="subtle" onClick={() => setColOpen(true)}>
            <Columns3 size={16} /> Add column
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} /> New product
          </Button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Inventory value"
          value={`৳${stats.value.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`}
          accent
        />
        <Stat label="Total units" value={stats.totalUnits.toLocaleString()} />
        <Stat
          label="Low stock"
          value={String(stats.low)}
          tone={stats.low ? "warn" : undefined}
        />
        <Stat
          label="Out of stock"
          value={String(stats.out)}
          tone={stats.out ? "bad" : undefined}
        />
      </section>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, category…"
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--amber)]"
          />
        </div>
        <Button
          variant="ghost"
          onClick={() => load()}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--bad)]/40 bg-[var(--bad)]/10 px-4 py-3 text-sm text-[var(--bad)]">
          {error} — check that the n8n webhooks are reachable, then refresh.
        </div>
      )}

      {showEmptyLoader ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] py-20 text-sm text-[var(--text-dim)]">
          <RefreshCw size={16} className="mr-2 animate-spin" /> Loading
          inventory…
        </div>
      ) : (
        <InventoryTable
          rows={rows}
          columns={columns}
          query={query}
          onEdit={openEdit}
          onDelete={setDeleting}
          onRemoveColumn={removeColumn}
        />
      )}

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        columns={columns}
        initial={editing}
        onSubmit={handleSubmit}
      />
      <AddColumnDialog open={colOpen} onClose={() => setColOpen(false)} />
      <ConfirmDelete
        open={!!deleting}
        productName={deleting?.product_name ?? ""}
        onClose={() => setDeleting(undefined)}
        onConfirm={confirmDelete}
      />
      <Toasts />
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "warn" | "bad";
}) {
  const color = accent
    ? "var(--amber)"
    : tone === "warn"
      ? "var(--warn)"
      : tone === "bad"
        ? "var(--bad)"
        : "var(--text)";
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </div>
      <div className="mono mt-1 text-lg font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
