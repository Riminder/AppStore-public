import { NextRequest, NextResponse } from "next/server";
import { getEventsSince } from "@/app/lib/eventStore";

/**
 * GET /api/openclaw/events?cursor=0 — Poll for new events
 *
 * Returns events since the given cursor. The response includes a new cursor
 * for the next poll. Dashboard should poll every 1-2 seconds.
 *
 * Response:
 * {
 *   "events": [ { id, timestamp, channel, payload } ],
 *   "cursor": 42
 * }
 */
export async function GET(req: NextRequest) {
  const cursor = parseInt(req.nextUrl.searchParams.get("cursor") ?? "0", 10);
  const result = getEventsSince(cursor);
  return NextResponse.json(result);
}
