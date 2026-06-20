import { NextRequest, NextResponse } from "next/server";
import { callN8n } from "@/lib/n8n";
import { N8N } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing row id." }, { status: 400 });
    }
    if (!body.company_id) {
      return NextResponse.json(
        { error: "Missing company_id." },
        { status: 400 },
      );
    }
    await callN8n(N8N.endpoints.delete, {
      payload: { id: body.id, company_id: body.company_id },
    });
    return NextResponse.json({ id: body.id });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to delete product.",
      },
      { status: 502 },
    );
  }
}
