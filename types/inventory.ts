export type ColumnType = "text" | "number" | "currency" | "date" | "select" | "boolean";

export interface ColumnDef {
  /** Stable key. For defaults this is a top-level row field; for custom it lives in `attributes`. */
  key: string;
  label: string;
  type: ColumnType;
  /** true = built-in default column (cannot be deleted/renamed). */
  system: boolean;
  /** custom columns live under row.attributes[key]; defaults are top-level. */
  custom: boolean;
  required?: boolean;
  /** options for `select` type */
  options?: string[];
  /** display width hint (Tailwind min-w class fragment) */
  width?: string;
}

export interface InventoryRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived" | "out_of_stock";
  createdAt: string; // ISO date
  /** all user-defined custom columns live here */
  attributes: Record<string, string | number | boolean | null>;
}

export type RowDraft = Omit<InventoryRow, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

/** The seven predefined default columns, in display order. */
export const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Product name", type: "text", system: true, custom: false, required: true, width: "min-w-48" },
  { key: "sku", label: "SKU", type: "text", system: true, custom: false, required: true, width: "min-w-32" },
  { key: "category", label: "Category", type: "text", system: true, custom: false, width: "min-w-36" },
  { key: "price", label: "Price", type: "currency", system: true, custom: false, width: "min-w-28" },
  { key: "stock", label: "Stock quantity", type: "number", system: true, custom: false, width: "min-w-28" },
  {
    key: "status",
    label: "Status",
    type: "select",
    system: true,
    custom: false,
    options: ["active", "draft", "archived", "out_of_stock"],
    width: "min-w-32",
  },
  { key: "createdAt", label: "Created date", type: "date", system: true, custom: false, width: "min-w-36" },
];

export const STATUS_LABELS: Record<InventoryRow["status"], string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
  out_of_stock: "Out of stock",
};
