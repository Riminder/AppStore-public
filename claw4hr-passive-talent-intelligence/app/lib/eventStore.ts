/**
 * In-memory event store for OpenClaw → dashboard communication.
 * Supports both polling (getEventsSince) and push (subscribe) for SSE.
 */

import type { SourcedProfile } from "@/app/lib/types";

export interface OpenClawEvent {
  id: number;
  timestamp: string;
  channel: "chat" | "feed" | "action" | "profile";
  payload: {
    // chat
    type?: string;
    text?: string;
    // feed
    action?: string;
    detail?: string;
    status?: "done" | "running" | "error";
    feedType?: "connect" | "parse" | "score" | "source" | "analyze" | "notify";
    source?: string; // which connector: "github" | "linkedin" | "reddit" | "internet"
    // action
    command?: string;
    // profile (new)
    profile?: SourcedProfile;
  };
}

const MAX_EVENTS = 500;
const TTL_MS = 10 * 60 * 1000;

let events: OpenClawEvent[] = [];
let nextId = 1;

// SSE subscribers
type Subscriber = (event: OpenClawEvent) => void;
const subscribers = new Set<Subscriber>();

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function pushEvent(
  channel: OpenClawEvent["channel"],
  payload: OpenClawEvent["payload"],
): OpenClawEvent {
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
  // Notify SSE subscribers immediately
  subscribers.forEach((fn) => {
    try {
      fn(event);
    } catch {
      subscribers.delete(fn);
    }
  });
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
