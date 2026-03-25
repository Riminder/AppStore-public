# HrFlow.ai App Store

A public catalog of AI-powered HR apps built during the HrFlow.ai Hackathon.

Each app lives in its own folder at the repository root, uses its own stack, and follows a shared submission contract defined by `app.json`.

## Apps

<!-- This table is updated as teams submit their apps. -->

| App | Team | Type | Stack | Description |
|-----|------|------|-------|-------------|
| [example-hiring-dashboard](./example-hiring-dashboard/) | HrFlow.ai | hiring-agent | frontend (vanilla) | Example hiring dashboard using HrFlow.ai APIs |

## How It Works

- Each team builds an app powered by the [HrFlow.ai API](https://developers.hrflow.ai/)
- Apps can be anything: web apps, APIs, CLIs, browser extensions, mobile apps, workers
- Each app folder contains an `app.json` manifest describing the app, its stack, and its HrFlow.ai API usage
- CI validates every submission automatically on pull request

## For Teams

### Quick Start

1. Fork or clone this repository
2. Copy the template:
   ```bash
   cp -r templates/app-template <your-team>-<your-app>/
   ```
3. Edit `app.json` with your app's metadata
4. Build your app inside the folder
5. Add a preview image to `assets/`
6. Fill in `.env.example` with the env vars your app needs
7. Write a clear `README.md`
8. Open a PR from branch `team/<your-app-slug>` to `main`

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

## For Organizers

```bash
# Install tooling dependencies
npm install

# Validate all submissions
npm run validate

# List all apps
npm run list
```

## Repository Structure

```
app-store-public/
├── .github/            # CI workflows and PR template
├── schemas/            # JSON Schema for app.json
├── scripts/            # Validation and listing scripts
├── templates/          # Starter template for new apps
├── <team-app>/         # Team submission folders (at root)
└── ...
```
