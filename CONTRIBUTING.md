# Contributing to HrFlow.ai App Store

This guide explains how to submit your hackathon app.

## Prerequisites

- A GitHub account
- Git installed locally
- Your HrFlow.ai API credentials (provided by organizers)

## Step-by-Step Submission

### 1. Clone the repository

```bash
git clone git@github.com:Riminder/AppStore-public.git
cd AppStore-public
```

### 2. Create your branch

```bash
git checkout -b team/<your-app-slug>
```

Branch naming convention: `team/<your-app-slug>` (e.g. `team/smart-recruiter`).

### 3. Create your app folder

```bash
cp -r templates/ <your-team>-<your-app>/
```

Your folder name must:
- Be lowercase with hyphens only (e.g. `acme-hiring-bot`)
- Match the `slug` field in your `app.json`
- Live directly at the repository root

### 4. Edit your `app.json`

Fill in all required fields. See `schemas/app.schema.json` for the full specification.

Key rules:
- `slug` must match your folder name exactly
- `type` must be one of: `hiring-agent`, `sourcing-tool`, `analytics-dashboard`, `integration`, `other`
- `stack.type` must be one of: `frontend`, `backend`, `fullstack`, `mobile`, `cli`, `extension`, `worker`
- `hrflow.api_endpoints` must list which HrFlow.ai API endpoints your app uses
- `runtime.entrypoint` must be the command to start your app
- `runtime.env_vars` must document every environment variable your app needs

### 5. Fill in `.env.example`

List every environment variable your app needs with placeholder values:

```env
HRFLOW_API_KEY=your-api-key-here
HRFLOW_SOURCE_KEY=your-source-key-here
OPENAI_API_KEY=sk-your-key-here
```

**Never commit real API keys.** Use placeholders only.

### 6. Write your `README.md`

Your README should explain:
- What the app does
- How to install dependencies
- How to configure environment variables
- How to run the app
- What HrFlow.ai APIs it uses

### 7. Add a preview image

Place at least one screenshot or preview image in `assets/`:

```
your-app/assets/preview.png
```

Supported formats: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`

### 8. Build your app

Build whatever you want inside your folder. There are no restrictions on:
- Programming language
- Framework
- Internal folder structure
- Dependencies

Your app is fully autonomous.

### 9. Open a Pull Request

```bash
git add <your-app-folder>/
git commit -m "feat: add <your-app-name>"
git push origin team/<your-app-slug>
```

Then open a PR targeting `main`. Fill in the PR template checklist.

## Rules

1. **One folder per team.** Your folder name is your namespace.
2. **No changes outside your folder.** PRs touching other folders or root files will be rejected.
3. **No real secrets.** The CI scans for secret patterns and will fail your PR.
4. **No force pushes.**
5. **No `.env` files.** Only `.env.example` is allowed.
6. **Folder name = slug.** They must match.

## Secret Handling

| Do | Don't |
|----|-------|
| Use `.env.example` with placeholders | Commit `.env` with real keys |
| Reference `process.env.HRFLOW_API_KEY` in code | Hardcode `ask_abc123...` in source files |
| Document env vars in `app.json` runtime section | Put real keys in `app.json` |

## Validation

CI runs automatically on every PR. It checks:
- Required files exist (`app.json`, `README.md`, `.env.example`, preview asset)
- `app.json` is valid against the schema
- Slug matches folder name
- No secret patterns detected in source files
- No duplicate slugs

Run validation locally:

```bash
npm install
npm run validate
```

## Questions?

Ask the organizers during the hackathon.
