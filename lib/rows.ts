import type { InventoryRow } from "@/types/inventory";
import { DEFAULT_COLUMNS } from "@/types/inventory";

/** crypto.randomUUID with a fallback for odd runtimes. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_KEYS = new Set(DEFAULT_COLUMNS.map((c) => c.key));

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function coerceRow(input: unknown): InventoryRow {
  const o = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;

  // attributes may arrive nested or flattened; merge both.
  const nested =
    o.attributes && typeof o.attributes === "object"
      ? (o.attributes as Record<string, unknown>)
      : {};
  const flattened: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (!DEFAULT_KEYS.has(k) && k !== "id" && k !== "attributes") {
      flattened[k] = v;
    }
  }

  return {
    id: String(o.id ?? newId()),
    unique_product_id: String(o.unique_product_id ?? ""),
    product_name: String(o.product_name ?? ""),
    category: String(o.category ?? ""),
    description: String(o.description ?? ""),
    size: String(o.size ?? ""),
    color: String(o.color ?? ""),
    regular_price: toNumber(o.regular_price),
    offer_price: toNumber(o.offer_price),
    image_url: String(o.image_url ?? ""),
    inventory_quantity: toNumber(o.inventory_quantity),
    attributes: { ...flattened, ...nested } as InventoryRow["attributes"],
  };
}
