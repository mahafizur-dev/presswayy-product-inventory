export type ColumnType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "boolean";

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
  unique_product_id: string;
  product_name: string;
  category: string;
  description: string;
  size: string;
  color: string;
  regular_price: number;
  offer_price: number;
  image_url: string;
  inventory_quantity: number;
  /** all user-defined custom columns live here */
  attributes: Record<string, string | number | boolean | null>;
}

export type RowDraft = Omit<InventoryRow, "id"> & {
  id?: string;
};

/** The ten predefined default columns, in display order. */
export const DEFAULT_COLUMNS: ColumnDef[] = [
  {
    key: "unique_product_id",
    label: "Product ID",
    type: "text",
    system: true,
    custom: false,
    required: true,
    width: "min-w-32",
  },
  {
    key: "product_name",
    label: "Product name",
    type: "text",
    system: true,
    custom: false,
    required: true,
    width: "min-w-48",
  },
  {
    key: "category",
    label: "Category",
    type: "text",
    system: true,
    custom: false,
    width: "min-w-36",
  },
  {
    key: "description",
    label: "Description",
    type: "text",
    system: true,
    custom: false,
    width: "min-w-56",
  },
  {
    key: "size",
    label: "Size",
    type: "text",
    system: true,
    custom: false,
    width: "min-w-24",
  },
  {
    key: "color",
    label: "Color",
    type: "text",
    system: true,
    custom: false,
    width: "min-w-24",
  },
  {
    key: "regular_price",
    label: "Regular price",
    type: "currency",
    system: true,
    custom: false,
    width: "min-w-28",
  },
  {
    key: "offer_price",
    label: "Offer price",
    type: "currency",
    system: true,
    custom: false,
    width: "min-w-28",
  },
  {
    key: "image_url",
    label: "Image URL",
    type: "text",
    system: true,
    custom: false,
    width: "min-w-48",
  },
  {
    key: "inventory_quantity",
    label: "Inventory quantity",
    type: "number",
    system: true,
    custom: false,
    width: "min-w-28",
  },
];
