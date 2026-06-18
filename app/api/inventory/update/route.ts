import { NextRequest, NextResponse } from "next/server";
import { callN8n } from "@/lib/n8n";
import { N8N, normalizeListResponse } from "@/lib/config";
import { coerceRow } from "@/lib/rows";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing row id." }, { status: 400 });
    }
    const raw = await callN8n(N8N.endpoints.update, { payload: body });
    const echoed = normalizeListResponse(raw)[0];
    const row = coerceRow(echoed ?? body);
    return NextResponse.json({ row });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update product." },
      { status: 502 }
    );
  }
}
