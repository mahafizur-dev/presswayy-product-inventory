import { create } from "zustand";
import type { ColumnDef, InventoryRow, RowDraft } from "../types/inventory";
import { DEFAULT_COLUMNS } from "../types/inventory";
import { api } from "../lib/api";

const LS_KEY = "inventory.customColumns.v1";

function loadCustomDefs(): ColumnDef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ColumnDef[]) : [];
  } catch {
    return [];
  }
}

function saveCustomDefs(defs: ColumnDef[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(defs));
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
  rows: InventoryRow[];
  customColumns: ColumnDef[];
  loading: boolean;
  error: string | null;
  toasts: ToastMsg[];

  columns: () => ColumnDef[];
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
  rows: [],
  customColumns: [],
  loading: false,
  error: null,
  toasts: [],

  columns: () => [...DEFAULT_COLUMNS, ...get().customColumns],

  toast: (kind, text) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, kind, text }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { rows } = await api.list();
      // reconcile: union of cached defs + any attribute keys seen in data
      const cached = loadCustomDefs();
      const seen = new Map(cached.map((d) => [d.key, d]));
      for (const row of rows) {
        for (const key of Object.keys(row.attributes ?? {})) {
          if (!seen.has(key)) {
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
      saveCustomDefs(customColumns);
      set({ rows, customColumns, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Could not reach the inventory service.",
      });
    }
  },

  addRow: async (draft) => {
    try {
      const { row } = await api.create(draft);
      set((s) => ({ rows: [row, ...s.rows] }));
      get().toast("success", "Product added.");
    } catch (err) {
      get().toast("error", err instanceof Error ? err.message : "Could not add product.");
      throw err;
    }
  },

  editRow: async (row) => {
    const prev = get().rows;
    // optimistic
    set((s) => ({ rows: s.rows.map((r) => (r.id === row.id ? row : r)) }));
    try {
      const { row: saved } = await api.update(row);
      set((s) => ({ rows: s.rows.map((r) => (r.id === saved.id ? saved : r)) }));
      get().toast("success", "Changes saved.");
    } catch (err) {
      set({ rows: prev }); // rollback
      get().toast("error", err instanceof Error ? err.message : "Could not save changes.");
      throw err;
    }
  },

  deleteRow: async (id) => {
    const prev = get().rows;
    set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })); // optimistic
    try {
      await api.remove(id);
      get().toast("success", "Product deleted.");
    } catch (err) {
      set({ rows: prev }); // rollback
      get().toast("error", err instanceof Error ? err.message : "Could not delete product.");
    }
  },

  addColumn: (def) => {
    const key = def.key.trim();
    if (!key) return;
    if (get().columns().some((c) => c.key === key)) {
      get().toast("error", `A column called "${def.label}" already exists.`);
      return;
    }
    const full: ColumnDef = { ...def, key, system: false, custom: true };
    const customColumns = [...get().customColumns, full];
    saveCustomDefs(customColumns);
    set({ customColumns });
    get().toast("success", `Added column "${def.label}".`);
  },

  removeColumn: (key) => {
    const customColumns = get().customColumns.filter((c) => c.key !== key);
    saveCustomDefs(customColumns);
    set({ customColumns });
  },
}));
