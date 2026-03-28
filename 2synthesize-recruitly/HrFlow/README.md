# AI Candidate Synthesis Agent

This project is an AI-powered recruitment assistant that generates **standardized candidate syntheses** for shortlisted applicants.

The system consolidates three main evaluation sources:

1. **CV / profile matching**
2. **test results**
3. **interview feedback**

The goal is to transform fragmented recruitment signals into a **single structured recruitment summary** that is:
- clear,
- explainable,
- consistent across candidates,
- easy for recruiters to compare.

This project is designed as a **controlled AI pipeline**, not as a free-form chatbot.
The intelligence comes from:
- structured data processing,
- weighted multi-source fusion,
- two specialized AI reasoning steps.

---

## What it does

This application is an AI-powered recruitment backend that automates the candidate evaluation process. It uses **HrFlow.ai** to parse resumes and score profiles, then combines those results with manual test scores and interview transcripts. A "Fusion" layer processes this data, and an **LLM (Claude/Grok/Groq)** generates a final, structured synthesis report to help recruiters make data-driven hiring decisions.

Recruitment evaluation is often fragmented across:
- resumes,
- technical tests,
- interview notes,
- recruiter impressions.

This creates several problems:
- inconsistent decision-making,
- subjective assessments,
- weak comparability across candidates,
- poor traceability of hiring recommendations.

Our solution is an AI agent pipeline that:
- standardizes all candidate inputs,
- extracts structured signals from raw human feedback,
- combines objective and qualitative evidence,
- generates a final hiring-oriented synthesis.

---

The objective of the system is to produce a **standardized candidate synthesis report** based on:

- **CV/profile matching analysis**
- **technical / structured test results**
- **interview feedback**
- **motivation and psychological signals extracted from interview text**

The final output must be a **single file / single report** that summarizes:
- technical fit,
- motivation,
- communication / behavioral signals,
- risks,
- final recommendation.

---

## HrFlow.ai APIs used

- `POST /v1/profile/parsing/file` — Extract structured profile data from uploaded CVs.
- `GET /v1/profiles/scoring` — Score parsed profiles against specific job requirements.

## How to run

### Prerequisites

- **Python 3.10+**
- **HrFlow.ai Account**: API Key and Source Key.
- **LLM Provider API Key**: (Anthropic, xAI, or Groq).

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Then fill in your actual API keys in .env

# Start the app
uvicorn main:app --reload  ##loads the backend
npm run install ##install dependencies for the front
npm run dev ## runs the front 


### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HRFLOW_API_KEY` | Yes | HrFlow.ai API secret key |
| `HRFLOW_SOURCE_KEY` | Yes | HrFlow.ai source key |
|HRFLOW_USER_EMAIL|Yes|HrFlow.ai user account email
|ANTHROPIC_API_KEY|Yes|LLM provider api key

## Screenshots

![Preview](./assets/preview.png)
![Preview](./assets/preview2.png)

## Team

- **Nabil Chartouni** — Lead
- **Wilfrid Wangon** — Developer