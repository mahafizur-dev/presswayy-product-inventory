import { NextRequest, NextResponse } from "next/server";
import { callN8n } from "@/lib/n8n";
import { N8N, normalizeListResponse } from "@/lib/config";
import { coerceRow, newId } from "@/lib/rows";

/**
 * Returns true only if the object looks like an actual product row.
 * The create endpoint's n8n workflow responds with a VPS ingest *summary*
 * (batches_sent, processed, total_products, …) — NOT the saved product.
 * We must ignore that summary and fall back to the payload, otherwise
 * coerceRow produces an empty row (blank cells / ৳0.00) until refresh.
 */
function looksLikeRow(o: unknown): o is Record<string, unknown> {
  if (!o || typeof o !== "object") return false;
  const r = o as Record<string, unknown>;
  return (
    "unique_product_id" in r ||
    "product_name" in r ||
    "sku" in r ||
    "title" in r
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.company_id) {
      return NextResponse.json(
        { error: "Missing company_id." },
        { status: 400 },
      );
    }

    // Assign an id as a client-side fallback so the UI is consistent
    // even if n8n doesn't echo the saved record back.
    const payload = {
      ...body,
      id: body.id || newId(),
    };

    const raw = await callN8n(N8N.endpoints.create, { payload });

    // The create endpoint returns an ingest summary, not the product row.
    // Only trust the echoed object when it actually carries product fields;
    // otherwise the payload is the reliable source of truth.
    const candidate = normalizeListResponse(raw)[0];
    const row = coerceRow(looksLikeRow(candidate) ? candidate : payload);

    return NextResponse.json({ row });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to create product.",
      },
      { status: 502 },
    );
  }
}
