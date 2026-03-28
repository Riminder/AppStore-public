/**
 * In-memory event store for OpenClaw webhook → dashboard communication.
 * Events are stored with a cursor so the dashboard can poll for new ones.
 *
 * This is intentionally simple (in-memory, no persistence) — perfect for a hackathon demo.
 * Events are auto-cleaned after 10 minutes to avoid memory leaks.
 */

export interface OpenClawEvent {
  id: number;
  timestamp: string;
  // "chat" → goes to WhatsAppPanel, "feed" → goes to AgentFeed, "action" → triggers pipeline actions
  channel: "chat" | "feed" | "action";
  payload: {
    // For chat: "user" | "agent"
    type?: string;
    text?: string;
    // For feed: action name, detail, status, event type
    action?: string;
    detail?: string;
    status?: "done" | "running" | "error";
    feedType?: "connect" | "parse" | "score" | "source" | "analyze" | "notify";
    // For action: command to execute (e.g., "fetch_profiles", "send_summary")
    command?: string;
  };
}

const MAX_EVENTS = 500;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

let events: OpenClawEvent[] = [];
let nextId = 1;

export function pushEvent(channel: OpenClawEvent["channel"], payload: OpenClawEvent["payload"]): OpenClawEvent {
  cleanup();
  const event: OpenClawEvent = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    channel,
    payload,
  };
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }
  return event;
}

export function getEventsSince(cursor: number): { events: OpenClawEvent[]; cursor: number } {
  cleanup();
  const newEvents = events.filter((e) => e.id > cursor);
  const newCursor = events.length > 0 ? events[events.length - 1].id : cursor;
  return { events: newEvents, cursor: newCursor };
}

function cleanup() {
  const cutoff = Date.now() - TTL_MS;
  events = events.filter((e) => new Date(e.timestamp).getTime() > cutoff);
}
