# ClawedIn — AI Job Finding Agent

> Upload your CV. Let AI find your next job.

ClawedIn is an AI-powered job matching agent built for the HrFlow.ai Hackathon. It parses a candidate's CV using HrFlow.ai, generates relevant job roles using OpenClaw (local LLM), searches real job listings via Brave Search, and ranks them by profile match.

---

## What It Does

1. **CV Parsing** — Upload a PDF resume. HrFlow.ai extracts skills, experience, and profile data.
2. **Job Role Generation** — OpenClaw LLM analyses extracted skills and suggests 10 relevant job titles.
3. **Job Search** — Brave Search API finds real job listings from LinkedIn, Indeed, Welcome to the Jungle, APEC, Glassdoor, and Talent.io.
4. **AI Ranking** — OpenClaw ranks the listings by match quality and explains why each job fits the candidate.
5. **Results Dashboard** — Candidates see ranked jobs with match scores, reasons, and direct apply links.

---

## Architecture
```
Streamlit UI (port 8501)
    ↓ Upload CV
FastAPI Skill (port 8001)
    ↓ HrFlow Parsing API → extract skills
    ↓ Brave Search API → find real job listings
    ↓ OpenClaw LLM → rank jobs by relevance
    ↓ return ranked results
OpenClaw Gateway (port 18789)
    ↓ qwen3:1.7b via Ollama (local LLM)
```

---

## HrFlow.ai APIs Used

| API | Purpose |
|-----|---------|
| `profile/parsing/add_file` | Parse uploaded CV PDF and extract skills, experience, profile data |
| `job/searching` | Search indexed job listings |
| `job/scoring` | Score jobs against candidate profile |

---

## Prerequisites

- Python 3.12+
- [Ollama](https://ollama.ai) with `qwen3:1.7b` model
- [OpenClaw](https://openclaw.ai) gateway
- Brave Search API key (free tier available at [brave.com/search/api](https://brave.com/search/api))
- HrFlow.ai API credentials

---

## Installation

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/app-store-public.git
cd app-store-public/clawedin
```

### 2. Install FastAPI dependencies
```bash
cd hrflow-skill
pip install poetry
poetry install
```

### 3. Install Streamlit dependencies
```bash
cd ../Streamlit
pip install -r requirements.txt
```

### 4. Install Ollama and pull model
```bash
# Install Ollama from https://ollama.ai
ollama pull qwen3:1.7b
```

### 5. Install and configure OpenClaw
```bash
npm install -g openclaw
openclaw configure
openclaw config set plugins.entries.brave.enabled true
openclaw config set plugins.entries.brave.config.webSearch.apiKey "YOUR_BRAVE_KEY"
openclaw config set tools.web.search.provider "brave"
```

---

## Configuration

Copy `.env.example` to `.env` in the `hrflow-skill` folder:
```bash
cp hrflow-skill/.env.example hrflow-skill/.env
```

Fill in your credentials:
```env
HRFLOW_API_KEY=your_hrflow_api_key
HRFLOW_USER_EMAIL=your_hrflow_email
HRFLOW_SOURCE_KEY=your_source_key
HRFLOW_BOARD_KEY=your_board_key
BRAVE_API_KEY=your_brave_api_key
GATEWAY_TOKEN=your_openclaw_gateway_token
```

---

## Running the App

Open 3 terminals:

**Terminal 1 — OpenClaw Gateway**
```bash
openclaw gateway --port 18789
```

**Terminal 2 — FastAPI Skill**
```bash
cd hrflow-skill
poetry run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 — Streamlit UI**
```bash
cd Streamlit
streamlit run app.py --server.address 0.0.0.0 --server.port 8501
```

Open your browser at `http://localhost:8501`

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Streamlit |
| Backend | FastAPI (Python) |
| LLM | qwen3:1.7b via Ollama |
| AI Agent | OpenClaw 2026.3.24 |
| Job Search | Brave Search API |
| CV Parsing | HrFlow.ai Parsing API |

---

## Team

**Team 7 — ClawedIn**
Built at the HrFlow.ai Hackathon 2026.
