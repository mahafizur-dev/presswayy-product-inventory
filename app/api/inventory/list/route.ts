import { NextResponse } from "next/server";
import { callN8n } from "@/lib/n8n";
import { N8N, normalizeListResponse } from "@/lib/config";
import { coerceRow } from "@/lib/rows";

export async function GET() {
  try {
    const raw = await callN8n(N8N.endpoints.list);
    const rows = normalizeListResponse(raw).map(coerceRow);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load inventory." },
      { status: 502 }
    );
  }
}
