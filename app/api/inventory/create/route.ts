import { NextRequest, NextResponse } from "next/server";
import { callN8n } from "@/lib/n8n";
import { N8N, normalizeListResponse } from "@/lib/config";
import { coerceRow, newId } from "@/lib/rows";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.company_id) {
      return NextResponse.json(
        { error: "Missing company_id." },
        { status: 400 },
      );
    }
    // assign an id client-side fallback so the UI is consistent
    // even if n8n doesn't echo the saved record back.
    const payload = {
      ...body,
      id: body.id || newId(),
    };
    const raw = await callN8n(N8N.endpoints.create, { payload });
    const echoed = normalizeListResponse(raw)[0];
    const row = coerceRow(echoed ?? payload);
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
