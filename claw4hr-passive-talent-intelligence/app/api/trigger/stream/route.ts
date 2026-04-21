import { subscribe, getEventsSince } from "@/app/lib/eventStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/trigger/stream
 * Server-Sent Events stream — pushes sourcing events to the dashboard in real time.
 *
 * Query params:
 *   cursor (optional): last event id seen (to catch up on missed events)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = parseInt(url.searchParams.get("cursor") ?? "0", 10);
  const cursor = Number.isFinite(raw) && raw >= 0 ? raw : 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const { events: missed } = getEventsSince(cursor);
      for (const event of missed) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      const unsubscribe = subscribe((event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          unsubscribe();
          try { controller.close(); } catch { /* already closed */ }
        }
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
          try { controller.close(); } catch { /* already closed */ }
        }
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
