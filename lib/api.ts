import type { InventoryRow, RowDraft } from "./../types/inventory";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status}).`);
  }
  return data as T;
}

export const api = {
  list: () => fetch("/api/inventory/list").then((r) => json<{ rows: InventoryRow[] }>(r)),

  create: (draft: RowDraft) =>
    fetch("/api/inventory/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).then((r) => json<{ row: InventoryRow }>(r)),

  update: (row: InventoryRow) =>
    fetch("/api/inventory/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }).then((r) => json<{ row: InventoryRow }>(r)),

  remove: (id: string) =>
    fetch("/api/inventory/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then((r) => json<{ id: string }>(r)),
};
