import { NextRequest, NextResponse } from "next/server";
import { callN8n } from "@/lib/n8n";
import { N8N, normalizeListResponse } from "@/lib/config";
import { coerceRow } from "@/lib/rows";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.company_id) {
      return NextResponse.json(
        { error: "Missing company_id." },
        { status: 400 },
      );
    }
    const raw = await callN8n(N8N.endpoints.list, {
      payload: { company_id: body.company_id },
    });
    const rows = normalizeListResponse(raw).map(coerceRow);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to load inventory.",
      },
      { status: 502 },
    );
  }
}
