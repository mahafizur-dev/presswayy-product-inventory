import { N8N, type EndpointConfig } from "./config";

/**
 * Server-only helper that talks to n8n. Lives behind Next.js route handlers so
 * the webhook URLs and any future auth stay off the client and CORS is a
 * non-issue.
 */

interface CallOptions {
  /** body for POST/PUT/PATCH, or query params for GET/DELETE */
  payload?: Record<string, unknown>;
}

export async function callN8n(
  endpoint: EndpointConfig,
  { payload = {} }: CallOptions = {}
): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (N8N.authHeader && N8N.authValue) headers[N8N.authHeader] = N8N.authValue;

  let url = endpoint.url;
  const init: RequestInit = { method: endpoint.method, headers, cache: "no-store" };

  if (endpoint.method === "GET" || endpoint.method === "DELETE") {
    const qs = new URLSearchParams(
      Object.entries(payload).map(([k, v]) => [k, String(v)])
    ).toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  } else {
    init.body = JSON.stringify(payload);
  }

  const res = await fetch(url, init);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `n8n ${endpoint.method} ${endpoint.url} → ${res.status}: ${text.slice(0, 300)}`
    );
  }

  // n8n may return empty body on success (e.g. "no item to return")
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export { N8N };
