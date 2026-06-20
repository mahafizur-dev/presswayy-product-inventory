import { create } from "zustand";
import type { ColumnDef, InventoryRow, RowDraft } from "@/types/inventory";
import { DEFAULT_COLUMNS } from "@/types/inventory";
import { api } from "@/lib/api";

/**
 * Custom column definitions are persisted by riding along inside each row's
 * `attributes`: any attribute key present on a row implies a column. We also
 * keep an explicit definition list so a freshly added column with no data yet
 * still shows up, and so we remember its type. That list is hydrated from a
 * lightweight localStorage cache and reconciled with whatever keys come back
 * from n8n on load.
 */

const LS_PREFIX = "inventory.customColumns.v1";

function lsKey(companyId: string) {
  return `${LS_PREFIX}.${companyId}`;
}

function loadCustomDefs(companyId: string): ColumnDef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(lsKey(companyId));
    return raw ? (JSON.parse(raw) as ColumnDef[]) : [];
  } catch {
    return [];
  }
}

function saveCustomDefs(companyId: string, defs: ColumnDef[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lsKey(companyId), JSON.stringify(defs));
  } catch {
    /* ignore quota errors */
  }
}

export interface ToastMsg {
  id: string;
  kind: "success" | "error";
  text: string;
}

interface InventoryState {
  companyId: string;
  rows: InventoryRow[];
  customColumns: ColumnDef[];
  loading: boolean;
  error: string | null;
  toasts: ToastMsg[];

  columns: () => ColumnDef[];
  setCompany: (companyId: string) => void;
  load: () => Promise<void>;
  addRow: (draft: RowDraft) => Promise<void>;
  editRow: (row: InventoryRow) => Promise<void>;
  deleteRow: (id: string) => Promise<void>;
  addColumn: (def: Omit<ColumnDef, "system" | "custom">) => void;
  removeColumn: (key: string) => void;
  toast: (kind: ToastMsg["kind"], text: string) => void;
  dismissToast: (id: string) => void;
}

export const useInventory = create<InventoryState>((set, get) => ({
  companyId: "",
  rows: [],
  customColumns: [],
  loading: false,
  error: null,
  toasts: [],

  columns: () => [...DEFAULT_COLUMNS, ...get().customColumns],

  setCompany: (companyId) => {
    if (get().companyId === companyId) return;
    // switching company → clear current data and load that company's cached cols
    set({
      companyId,
      rows: [],
      customColumns: loadCustomDefs(companyId),
      error: null,
    });
  },

  toast: (kind, text) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, kind, text }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  load: async () => {
    const companyId = get().companyId;
    if (!companyId) {
      set({ error: "No company selected.", loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { rows } = await api.list(companyId);
      // reconcile: union of cached defs + any attribute keys seen in data.
      // Match keys tolerantly (vats vs Vats) so the backend's prettified
      // attribute keys don't create duplicate columns next to the user's.
      const norm = (k: string) =>
        String(k || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");
      const cached = loadCustomDefs(companyId);
      const seen = new Map(cached.map((d) => [d.key, d]));
      const seenNorm = new Set(cached.map((d) => norm(d.key)));
      for (const row of rows) {
        for (const key of Object.keys(row.attributes ?? {})) {
          if (!seenNorm.has(norm(key))) {
            seenNorm.add(norm(key));
            seen.set(key, {
              key,
              label: key,
              type: "text",
              system: false,
              custom: true,
            });
          }
        }
      }
      const customColumns = [...seen.values()];
      saveCustomDefs(companyId, customColumns);
      set({ rows, customColumns, loading: false });
    } catch (err) {
      set({
        loading: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not reach the inventory service.",
      });
    }
  },

  addRow: async (draft) => {
    try {
      const { row } = await api.create(get().companyId, draft);
      set((s) => ({ rows: [...s.rows, row] }));
      get().toast("success", "Product added.");
    } catch (err) {
      get().toast(
        "error",
        err instanceof Error ? err.message : "Could not add product.",
      );
      throw err;
    }
  },

  editRow: async (row) => {
    const prev = get().rows;
    // optimistic
    set((s) => ({ rows: s.rows.map((r) => (r.id === row.id ? row : r)) }));
    try {
      const { row: saved } = await api.update(get().companyId, row);
      set((s) => ({
        rows: s.rows.map((r) => (r.id === saved.id ? saved : r)),
      }));
      get().toast("success", "Changes saved.");
    } catch (err) {
      set({ rows: prev }); // rollback
      get().toast(
        "error",
        err instanceof Error ? err.message : "Could not save changes.",
      );
      throw err;
    }
  },

  deleteRow: async (id) => {
    const prev = get().rows;
    set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })); // optimistic
    try {
      await api.remove(get().companyId, id);
      get().toast("success", "Product deleted.");
    } catch (err) {
      set({ rows: prev }); // rollback
      get().toast(
        "error",
        err instanceof Error ? err.message : "Could not delete product.",
      );
    }
  },

  addColumn: (def) => {
    const key = def.key.trim();
    if (!key) return;
    if (
      get()
        .columns()
        .some((c) => c.key === key)
    ) {
      get().toast("error", `A column called "${def.label}" already exists.`);
      return;
    }
    const full: ColumnDef = { ...def, key, system: false, custom: true };
    const customColumns = [...get().customColumns, full];
    saveCustomDefs(get().companyId, customColumns);
    set({ customColumns });
    get().toast("success", `Added column "${def.label}".`);
  },

  removeColumn: (key) => {
    const customColumns = get().customColumns.filter((c) => c.key !== key);
    saveCustomDefs(get().companyId, customColumns);
    set({ customColumns });
  },
}));
