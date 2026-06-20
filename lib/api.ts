import type { InventoryRow, RowDraft } from "@/types/inventory";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status}).`,
    );
  }
  return data as T;
}

const post = (path: string, payload: unknown) =>
  fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

/**
 * Every call is scoped to a company. The companyId is sent in the JSON body
 * so the Next.js route handlers can forward it to n8n, which filters/inserts
 * by company_id.
 */
export const api = {
  list: (companyId: string) =>
    post("/api/inventory/list", { company_id: companyId }).then((r) =>
      json<{ rows: InventoryRow[] }>(r),
    ),

  create: (companyId: string, draft: RowDraft) =>
    post("/api/inventory/create", { ...draft, company_id: companyId }).then(
      (r) => json<{ row: InventoryRow }>(r),
    ),

  update: (companyId: string, row: InventoryRow) =>
    post("/api/inventory/update", { ...row, company_id: companyId }).then((r) =>
      json<{ row: InventoryRow }>(r),
    ),

  remove: (companyId: string, id: string) =>
    post("/api/inventory/delete", { id, company_id: companyId }).then((r) =>
      json<{ id: string }>(r),
    ),
};
