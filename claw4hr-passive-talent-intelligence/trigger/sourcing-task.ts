import { task } from "@trigger.dev/sdk/v3";

export interface SourcingPayload {
  query: string;
  webhookUrl: string;
}

export interface SourcingResult {
  profilesFound: number;
}

/**
 * Sourcing task — runs externally via trigger.dev.
 *
 * Receives a recruiter query, searches LinkedIn/GitHub/Reddit/web,
 * enriches profiles via HrFlow, and POSTs each discovered profile
 * to webhookUrl as it is found.
 *
 * Webhook payload (POST to webhookUrl):
 *   { channel: "profile", payload: { profile: SourcedProfile } }
 *
 * Agent status updates:
 *   { channel: "feed", payload: { source: AgentSource, status: "running" | "done", message: string, logType: "info" | "found" | "score" | "done" } }
 */
export const sourcingTask = task({
  id: "sourcing-task",
  retry: { maxAttempts: 2 },
  run: async (payload: SourcingPayload): Promise<SourcingResult> => {
    const { query, webhookUrl } = payload;

    const pushEvent = async (channel: string, body: Record<string, unknown>) => {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, payload: body }),
      });
    };

    // TODO: implement real sourcing logic
    // 1. Parse query → extract role, skills, location, seniority
    // 2. Run parallel agents: LinkedIn x-ray, GitHub search, Reddit contributors, web scan
    // 3. For each candidate found, push a "feed" event (log) then a "profile" event
    // 4. Enrich profiles via HrFlow (parse + score against job board)
    // 5. Push final "feed" done events per agent

    await pushEvent("feed", { source: "linkedin", status: "running", message: `Starting sourcing for: ${query}`, logType: "info" });

    return { profilesFound: 0 };
  },
});
