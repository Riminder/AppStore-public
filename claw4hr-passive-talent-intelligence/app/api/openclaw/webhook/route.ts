import { NextRequest, NextResponse } from "next/server";
import { pushEvent, type OpenClawEvent } from "@/app/lib/eventStore";

/**
 * POST /api/openclaw/webhook — Receive events from OpenClaw
 *
 * Body (single event):
 * {
 *   "channel": "chat" | "feed" | "action",
 *   "payload": {
 *     "type": "user" | "agent",     // for chat
 *     "text": "message text",        // for chat
 *     "action": "Parsing CV",        // for feed
 *     "detail": "lot 1/5",           // for feed
 *     "status": "running",           // for feed: "done" | "running" | "error"
 *     "feedType": "parse",           // for feed: "connect" | "parse" | "score" | "source" | "analyze" | "notify"
 *     "command": "fetch_profiles"    // for action: triggers dashboard behavior
 *   }
 * }
 *
 * Body (batch):
 * { "events": [ ...array of events above... ] }
 *
 * Examples:
 *
 * Chat message from recruiter via Telegram:
 * curl -X POST .../api/openclaw/webhook \
 *   -H "Content-Type: application/json" \
 *   -d '{"channel":"chat","payload":{"type":"user","text":"Trouve-moi des devs Python"}}'
 *
 * Agent response:
 * curl -X POST .../api/openclaw/webhook \
 *   -H "Content-Type: application/json" \
 *   -d '{"channel":"chat","payload":{"type":"agent","text":"Je lance l analyse..."}}'
 *
 * Feed event:
 * curl -X POST .../api/openclaw/webhook \
 *   -H "Content-Type: application/json" \
 *   -d '{"channel":"feed","payload":{"action":"Parsing CV","detail":"10 CVs traites","status":"done","feedType":"parse"}}'
 *
 * Trigger scoring:
 * curl -X POST .../api/openclaw/webhook \
 *   -H "Content-Type: application/json" \
 *   -d '{"channel":"action","payload":{"command":"fetch_profiles"}}'
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support batch mode
    const items: { channel: OpenClawEvent["channel"]; payload: OpenClawEvent["payload"] }[] =
      body.events ?? [body];

    const created = items.map((item) => pushEvent(item.channel, item.payload));

    return NextResponse.json({ code: 200, message: "OK", count: created.length }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
