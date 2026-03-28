# HRFlow AI Interview MVP

This project is an AI interview app built around HRFlow data.

It fetches a candidate profile and a job offer from HRFlow, creates a short interview session, generates exactly 5 questions tailored to both the candidate and the job, scores the answers, and produces a final report that shows:

- the interview score computed by the app
- the HRFlow profile-vs-job match score
- strengths and concerns
- a hiring recommendation

## What the app does

The app has two parts:

- `frontend/`
  - React + Vite UI
  - fetches the candidate profile and the job from HRFlow
  - runs the interview flow
  - displays the final report

- `backend/`
  - FastAPI API
  - creates sessions from `profile + job_offer`
  - generates 5 interview questions
  - scores each answer
  - builds the final report
  - fetches the HRFlow profile/job grading score

The backend also uses the local `agent/` package for:

- question generation
- scoring
- report building

## Repository structure

```text
.
├── agent/
├── backend/
├── frontend/
├── .env.example
├── pyproject.toml
└── README.md
```

## How to install dependencies

### Backend

This repo uses a `uv` workspace.

From the repository root:

```bash
uv sync
```

If you prefer using the existing virtual environment manually:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ./agent -e ./backend
```

### Frontend

```bash
cd frontend
npm install
```

## How to configure environment variables

There are two env files to configure:

- root `.env` for the backend
- `frontend/.env` for the frontend

### 1. Backend env

Create a root `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Set the following variables:

```env
HRFLOW_API_KEY=
HRFLOW_USER_EMAIL=
HRFLOW_BASE_URL=https://api.hrflow.ai/v1
HRFLOW_SOURCE_KEY=
HRFLOW_BOARD_KEY=

OPEN_SOURCE_LLM_API_KEY=
OPEN_SOURCE_LLM_BASE_URL=
OPEN_SOURCE_LLM_MODEL=

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

What they are used for:

- `HRFLOW_API_KEY`
  - HRFlow API key used by the backend wrapper
- `HRFLOW_USER_EMAIL`
  - your HRFlow account email, sent as `X-USER-EMAIL`
- `HRFLOW_BASE_URL`
  - HRFlow API base URL
- `HRFLOW_SOURCE_KEY`
  - default HRFlow source key for profiles
- `HRFLOW_BOARD_KEY`
  - default HRFlow board key for jobs
- `OPEN_SOURCE_LLM_API_KEY`
  - optional key for an OpenAI-compatible LLM provider
- `OPEN_SOURCE_LLM_BASE_URL`
  - optional OpenAI-compatible base URL
- `OPEN_SOURCE_LLM_MODEL`
  - optional model name used for question generation
- `ELEVENLABS_API_KEY`
  - optional key for text-to-speech / speech-to-text
- `ELEVENLABS_VOICE_ID`
  - optional ElevenLabs voice id

Notes:

- If the LLM env vars are missing, question generation falls back to deterministic logic.
- If ElevenLabs env vars are missing, the app still works without TTS.

### 2. Frontend env

Create `frontend/.env` and set:

```env
VITE_HRFLOW_API_KEY=
VITE_HRFLOW_USER_EMAIL=
VITE_HRFLOW_SOURCE_KEY=
VITE_HRFLOW_BOARD_KEY=

VITE_ELEVENLABS_API_KEY=
VITE_ELEVENLABS_VOICE_ID=
```

What they are used for:

- `VITE_HRFLOW_API_KEY`
  - used by the frontend to fetch profile/job data directly from HRFlow via the Vite proxy
- `VITE_HRFLOW_USER_EMAIL`
  - sent by the frontend in HRFlow requests
- `VITE_HRFLOW_SOURCE_KEY`
  - default source key used in the landing page
- `VITE_HRFLOW_BOARD_KEY`
  - default board key used in the landing page
- `VITE_ELEVENLABS_API_KEY`
  - optional frontend TTS/STT support
- `VITE_ELEVENLABS_VOICE_ID`
  - optional frontend voice id

## How to run the app

### Run the backend

From the repository root:

```bash
uv run --package backend uvicorn backend.main:app --reload --port 8000
```

If port `8000` is already used:

```bash
uv run --package backend uvicorn backend.main:app --reload --port 8001
```

### Run the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

Then open the Vite URL shown in the terminal, usually:

- `http://localhost:5173`

## Typical app flow

1. Frontend fetches the candidate profile from HRFlow
2. Frontend fetches the job offer from HRFlow
3. Frontend sends both to `POST /sessions`
4. Backend creates a session and builds the candidate brief
5. Backend generates exactly 5 interview questions
6. Candidate answers each question
7. Backend scores each answer
8. Backend builds the final report
9. Backend calls HRFlow grading to fetch the profile-vs-job match score
10. Frontend displays both the interview score and the HRFlow score

## What HrFlow.ai APIs it uses

The app uses these HRFlow endpoints:

- `GET /v1/profile/indexing`
  - fetch the candidate profile

- `GET /v1/job/indexing`
  - fetch the job offer

- `GET /v1/profile/grading`
  - fetch the HRFlow profile-vs-job match score

Docs:

- Profile grading:
  - [https://developers.hrflow.ai/reference/grade-profiles-indexed-in-a-source-for-a-job](https://developers.hrflow.ai/reference/grade-profiles-indexed-in-a-source-for-a-job)

## Main backend endpoints

The backend exposes:

- `GET /health`
- `POST /sessions`
- `POST /sessions/{session_id}/start`
- `POST /sessions/{session_id}/answer`
- `GET /sessions/{session_id}/report`
- `POST /tts`

Swagger is available at:

- `http://localhost:8000/docs`

## Notes

- The HRFlow match score will only be returned if the submitted profile and job actually exist in HRFlow and the configured credentials are valid.
- The interview still works even when optional external services are unavailable.
