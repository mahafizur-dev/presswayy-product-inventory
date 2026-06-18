export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface EndpointConfig {
  url: string;
  method: HttpMethod;
}

const BASE =
  process.env.N8N_BASE_URL ?? "https://server.presswayy.com/webhook/api/v1";

export const N8N = {
  /** Optional bearer/api-key header sent to n8n. Empty = no auth (your case). */
  authHeader: process.env.N8N_AUTH_HEADER ?? "", // e.g. "Authorization"
  authValue: process.env.N8N_AUTH_VALUE ?? "", // e.g. "Bearer xxxxx"

  endpoints: {
    list: {
      url: process.env.N8N_LIST_URL ?? `${BASE}/list`,
      method: (process.env.N8N_LIST_METHOD as HttpMethod) ?? "POST",
    },
    create: {
      url: process.env.N8N_CREATE_URL ?? `${BASE}/create`,
      method: (process.env.N8N_CREATE_METHOD as HttpMethod) ?? "POST",
    },
    update: {
      url: process.env.N8N_UPDATE_URL ?? `${BASE}/update`,
      method: (process.env.N8N_UPDATE_METHOD as HttpMethod) ?? "POST",
    },
    delete: {
      url: process.env.N8N_DELETE_URL ?? `${BASE}/delete`,
      method: (process.env.N8N_DELETE_METHOD as HttpMethod) ?? "POST",
    },
  } satisfies Record<string, EndpointConfig>,
} as const;

/**
 * n8n responses vary wildly (a bare object, an array, `{ data: [...] }`,
 * `[{ json: {...} }]`, etc.). This walks common shapes and returns the rows.
 */
export function normalizeListResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    // n8n sometimes wraps each item as { json: {...} }
    return raw.map((item) =>
      item && typeof item === "object" && "json" in item
        ? (item as { json: unknown }).json
        : item
    );
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["data", "rows", "items", "results", "records"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // single object → single-row table
    return [raw];
  }
  return [];
}
