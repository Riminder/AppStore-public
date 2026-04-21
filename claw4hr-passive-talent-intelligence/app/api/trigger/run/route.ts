import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { sourcingTask } from "@/trigger/sourcing-task";

/**
 * POST /api/trigger/run
 * Starts a sourcing run via trigger.dev.
 *
 * Body: { "query": "Lead Data Scientist Paris 5 ans" }
 * Response: { "ok": true, "runId": "..." } or { "ok": false, "error": "..." }
 *
 * Returns 503 with TRIGGER_NOT_CONFIGURED if TRIGGER_SECRET_KEY is not set.
 * Results arrive asynchronously via POST /api/trigger/webhook → SSE /api/trigger/stream.
 */
export async function POST(req: NextRequest) {
  if (!process.env.TRIGGER_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, error: "TRIGGER_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ ok: false, error: "Missing query" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const webhookUrl = new URL("/api/trigger/webhook", base).toString();

    const handle = await tasks.trigger<typeof sourcingTask>("sourcing-task", {
      query,
      webhookUrl,
    });

    return NextResponse.json({ ok: true, runId: handle.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
