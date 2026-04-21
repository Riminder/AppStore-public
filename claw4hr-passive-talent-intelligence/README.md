# Claw4HR — AI Talent Sourcing Platform

Passive talent sourcing agent. Built for the HrFlow GenAI & RH Hackathon 2026.

A recruiter describes a role in natural language → multi-source agents discover matching profiles on GitHub, LinkedIn, Reddit, and the web → HrFlow scores each candidate → the recruiter interacts with profiles via Q&A and manages a pipeline.

**Deploy:** https://hrflowhackathon2026.vercel.app

---

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                   # http://localhost:3000
```

## Environment variables

| Variable | Description |
|---|---|
| `HRFLOW_API_KEY` | HrFlow API key (`ask_...`) |
| `HRFLOW_API_EMAIL` | HrFlow account email |
| `HRFLOW_SOURCE_KEY` | HrFlow profile source key |
| `HRFLOW_BOARD_KEY` | HrFlow job board key |
| `TRIGGER_SECRET_KEY` | trigger.dev secret key (sourcing pipeline) |
| `TRIGGER_PROJECT_ID` | trigger.dev project ID |
| `TRIGGER_WEBHOOK_SECRET` | Shared secret for webhook auth (optional) |
| `NEXT_PUBLIC_APP_URL` | App URL used to build the webhook callback |

---

## Architecture

### User flow

```
SearchView → LoadingView → ResultsView → ProfileDetailView
```

1. **SearchView** — natural language search bar
2. **LoadingView** — animated agents (GitHub / LinkedIn / Reddit / Web) with live terminal feed
3. **ResultsView** — scored candidate grid with filters and analytics
4. **ProfileDetailView** — full profile + HrFlow Q&A + SWOT analysis

### Data flow

```
Recruiter types a query
        ↓
POST /api/trigger/run          → triggers sourcing-task on trigger.dev
        ↓
sourcing-task runs externally  → POSTs profiles + agent events to webhook
        ↓
POST /api/trigger/webhook      → pushes to in-memory event store
        ↓
GET  /api/trigger/stream (SSE) → dashboard updates in real time
```

### File structure

```
app/
  components/
    Dashboard.tsx              Orchestrator (state, SSE, handlers)
    SearchView.tsx             Search bar
    LoadingView.tsx            Animated agents + live terminal
    ResultsView.tsx            Profile grid + live agent strip
    CandidateCard.tsx          Candidate card (score, skills, sources)
    ProfileDetailView.tsx      Full profile + Q&A
    PixelAgent.tsx             Pixel art sprites per source
    ScoreRing.tsx              Animated score ring
  lib/
    types.ts                   TypeScript types (SourcedProfile, FeedLog, ...)
    hrflow.ts                  HrFlow API client
    eventStore.ts              In-memory pub/sub (webhook → SSE stream)
  api/
    trigger/
      run/route.ts             POST — start a sourcing run via trigger.dev
      webhook/route.ts         POST — receive profiles + events from the task
      stream/route.ts          GET  — SSE stream to dashboard
      events/route.ts          GET  — cursor-based polling alternative
    hrflow/
      parse/route.ts           POST — parse a resume
      score/route.ts           GET  — score profiles against a job
      ask/route.ts             GET  — Q&A on a profile
      upskill/route.ts         GET  — SWOT strengths/gaps analysis
      profiles/route.ts        GET  — list profiles
      jobs/route.ts            GET  — list jobs
    account/
      searches/route.ts        Search history (Supabase)
      shortlist/route.ts       Shortlisted candidates (Supabase)
      outreach/route.ts        Outreach messages (Supabase)
    demo/
      ask/route.ts             Q&A fallback (Mistral)
      swot/route.ts            SWOT fallback (Mistral)
    outreach/
      generate/route.ts        Outreach message generation (Mistral)
trigger/
  sourcing-task.ts             trigger.dev task — multi-source candidate discovery
```

---

## Connecting the sourcing pipeline

The sourcing task (`trigger/sourcing-task.ts`) is a trigger.dev v3 task. Once configured, it receives a query and webhook URL, runs the multi-source sourcing logic, and POSTs each discovered profile back to the dashboard.

### Sending profiles to the dashboard

```bash
curl -X POST https://your-app.vercel.app/api/trigger/webhook \
  -H "Content-Type: application/json" \
  -H "x-trigger-secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "channel": "profile",
    "payload": {
      "profile": {
        "key": "unique-uuid",
        "name": "Jane Doe",
        "title": "Senior Data Scientist",
        "location": "Paris, France",
        "experience_years": 6,
        "summary": "3-sentence recruiter summary",
        "sources": [{"type": "github", "url": "https://github.com/...", "label": "github.com/..."}],
        "skills": ["Python", "NLP", "PyTorch"],
        "experiences": [{"title": "...", "company": "...", "location": "Paris", "period": "2021 — 2024", "description": "..."}],
        "educations": [{"degree": "...", "school": "...", "period": "..."}],
        "hrflow_score": -1,
        "hrflow_key": null,
        "avatar_color": "#1f2937"
      }
    }
  }'
```

---

## Stack

- **Frontend / Backend:** Next.js 16, React 19, Tailwind CSS v4, TypeScript
- **HR AI:** HrFlow.ai (parsing, scoring, Q&A, SWOT)
- **Sourcing pipeline:** trigger.dev v3
- **Outreach generation:** Mistral AI
- **Persistence:** Supabase (search history, shortlist, outreach)
- **Deploy:** Vercel
