import type { InventoryRow } from "./../types/inventory";
import { DEFAULT_COLUMNS } from "./../types/inventory";

/** crypto.randomUUID with a fallback for odd runtimes. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_KEYS = new Set(DEFAULT_COLUMNS.map((c) => c.key));
const VALID_STATUS = new Set(["active", "draft", "archived", "out_of_stock"]);

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Maps an unknown object (whatever n8n hands back) into a strict InventoryRow.
 * Unknown top-level fields are swept into `attributes` so custom columns
 * survive a round trip even if n8n flattens them.
 */
export function coerceRow(input: unknown): InventoryRow {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

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

  const status = String(o.status ?? "draft");

  return {
    id: String(o.id ?? newId()),
    name: String(o.name ?? ""),
    sku: String(o.sku ?? ""),
    category: String(o.category ?? ""),
    price: toNumber(o.price),
    stock: toNumber(o.stock ?? o.stockQuantity ?? o.quantity),
    status: (VALID_STATUS.has(status) ? status : "draft") as InventoryRow["status"],
    createdAt: String(o.createdAt ?? o.created_at ?? new Date().toISOString()),
    attributes: { ...flattened, ...nested } as InventoryRow["attributes"],
  };
}
