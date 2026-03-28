# HrFlow.ai App Store

A public catalog of AI-powered HR apps built during the HrFlow.ai Hackathon.

Each app lives in its own folder at the repository root, uses its own stack, and follows a shared submission contract defined by `app.json`.

## Apps

<!-- APP_TABLE_START -->

| App | Team | Description |
|-----|------|-------------|
| [Recruitly](./2synthesize-recruitly/) | 2synthesize | AI recruitment assistant that turns a CV, test scores, and interview notes into a structured hiring recommendation. |
| [Claw4HR — Passive Talent Intelligence](./claw4hr-passive-talent-intelligence/) | Claw4HR | AI-powered recruiter dashboard: describe a role via chat, and the agent scores indexed profiles using HrFlow AI, displays animated matching scores, clickable skills, SWOT analysis, and real-time pipeline feed. |
| [HEpiR — HR Evolution](./HEpiR-HREvolution/) | HEpiR | AI-powered recruitment dashboard. Ranks candidates per job using HrFlow scoring combined with an LLM adjustment layer, auto-generates structured synthesis reports, and lets HR attach documents (PDF, DOCX, audio) that feed back into the score. |
| [JobFinder](./kenfack-jobfinder/) | Franck Ulrich Kenfack | AI-powered job search assistant using HrFlow.ai for CV parsing, profile-job scoring, semantic search, match explanation, and skill extraction — combined with Claude for personalized career coaching and document generation. |
| [FirstRound](./rubber-sheep-first-round/) | Rubber Sheep | An AI-powered HR app that helps recruiters quickly identify top candidates by analyzing the result of their Ai powered interview |
| [Hiring Dashboard](./stark-hiring-dashboard/) | HrFlow.ai | A lightweight hiring dashboard that displays job listings and candidate profiles from HrFlow.ai APIs. |

<!-- APP_TABLE_END -->

## How It Works

- Each team builds an app powered by the [HrFlow.ai API](https://developers.hrflow.ai/)
- Apps can be anything: web apps, APIs, CLIs, browser extensions, mobile apps, workers
- Each app folder contains an `app.json` manifest describing the app, its stack, and its HrFlow.ai API usage
- CI validates every submission automatically on pull request

## For Teams

### Quick Start

1. **Fork** this repository to your own GitHub account
2. Clone your fork:
   ```bash
   git clone git@github.com:<your-username>/AppStore-public.git
   ```
3. Copy the template:
   ```bash
   cp -r templates/ <your-team>-<your-app>/
   ```
4. Edit `app.json` with your app's metadata
5. Build your app inside the folder
6. Add a preview image to `assets/`
7. Fill in `.env.example` with the env vars your app needs
8. Write a clear `README.md`
9. Push to your fork and open a PR to this repository's `master` branch

### Submission Rules

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

### Required Files

Every app folder must contain:

| File | Purpose |
|------|---------|
| `app.json` | Public manifest — metadata, stack, HrFlow.ai API usage |
| `README.md` | What the app does and how to run it |
| `.env.example` | Lists every env var the app needs with placeholder values |
| `assets/preview.png` | At least one preview image |

## For PR Submissions

```bash
# Install tooling dependencies
npm install

# Validate a submission
npm run validate

# List all apps
npm run list
```

## Repository Structure

```
AppStore-public/
├── .github/            # CI workflows and PR template
├── schemas/            # JSON Schema for app.json
├── scripts/            # Validation and listing scripts
├── templates/          # Starter template for new apps
├── <team-app>/         # Team submission folders (at root)
└── ...
```
