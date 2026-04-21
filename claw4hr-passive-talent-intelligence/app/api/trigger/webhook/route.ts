import { NextRequest, NextResponse } from "next/server";
import { pushEvent, type OpenClawEvent } from "@/app/lib/eventStore";

/**
 * POST /api/trigger/webhook
 * Receives events from the trigger.dev sourcing task and forwards them
 * to the SSE stream so the dashboard updates in real time.
 *
 * Supported channels: "chat" | "feed" | "action" | "profile"
 *
 * Profile event:
 *   { channel: "profile", payload: { profile: SourcedProfile } }
 *
 * Batch profiles shorthand:
 *   { profiles: [SourcedProfile, ...] }
 *
 * Feed log event:
 *   { channel: "feed", payload: { source, status, message, logType } }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.TRIGGER_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers.get("x-trigger-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();

    if (Array.isArray(body.profiles)) {
      if (body.profiles.length > 50) {
        return NextResponse.json(
          { error: "Batch size exceeds maximum of 50 profiles" },
          { status: 400 },
        );
      }

      const validProfiles = body.profiles.filter((p: unknown) => {
        if (typeof p !== "object" || p === null) return false;
        const rec = p as Record<string, unknown>;
        return (
          typeof rec.key === "string" &&
          typeof rec.name === "string" &&
          typeof rec.title === "string"
        );
      });

      const created = validProfiles.map((profile: unknown) =>
        pushEvent("profile", { profile: profile as OpenClawEvent["payload"]["profile"] }),
      );
      return NextResponse.json({ code: 200, message: "OK", count: created.length });
    }

    const VALID_CHANNELS = new Set(["chat", "feed", "action", "profile"]);
    const items: { channel: OpenClawEvent["channel"]; payload: OpenClawEvent["payload"] }[] =
      body.events ?? [body];

    const validItems = items.filter(
      (item) => typeof item.channel === "string" && VALID_CHANNELS.has(item.channel),
    );

    const created = validItems.map((item) => pushEvent(item.channel, item.payload));
    return NextResponse.json({ code: 200, message: "OK", count: created.length });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
