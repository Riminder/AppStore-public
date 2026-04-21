import { NextRequest, NextResponse } from "next/server";
import { getEventsSince } from "@/app/lib/eventStore";

/**
 * GET /api/trigger/events?cursor=0
 * Polling alternative to the SSE stream — returns events since cursor.
 *
 * Response: { events: [...], cursor: number }
 */
export async function GET(req: NextRequest) {
  const raw = parseInt(req.nextUrl.searchParams.get("cursor") ?? "0", 10);
  const cursor = Number.isFinite(raw) && raw >= 0 ? raw : 0;
  const result = getEventsSince(cursor);
  return NextResponse.json(result);
}
