---
name: hrflow
description: Job finding agent skill. Use this skill when a user wants to find jobs matching their CV/resume. Orchestrates the full pipeline: (1) parse CV PDF via HrFlow Parsing API to extract structured profile, (2) generate smart search keywords from the parsed profile using the LLM, (3) search the web for matching job listings, (4) score and rank each job against the candidate profile via HrFlow Scoring API, (5) return ranked jobs with match explanation. Triggers on phrases like "find me jobs", "match my CV", "job search", "upload my resume", "find jobs for me".
---

# HrFlow Job Finding Agent

## Pipeline Overview
```
CV PDF → Parse → Extract Keywords → Web Search → Score & Rank → Present Results
```

## Step 1: Parse CV

Call the FastAPI skill endpoint to parse the candidate's CV:
```
POST http://localhost:8001/parse-cv
Content-Type: multipart/form-data
Body: { file: <pdf> }
```

Extract from response:
- `profile_key` — unique ID for this profile (needed for scoring)
- `skills` — list of technical and soft skills
- `job_title` — current/target job title
- `experiences` — work history summary

## Step 2: Generate Search Keywords

Using the parsed profile, generate 3-5 targeted search queries. Focus on:
- Job title + key technical skills
- Industry + seniority level
- Location if mentioned in CV

Example: if profile has "Python, FastAPI, Data Engineer, 3 years" → generate:
- "Data Engineer Python FastAPI job"
- "Backend Python Engineer job opening"
- "Data pipeline engineer FastAPI position"

## Step 3: Web Search for Jobs

Use web search tools to search each query. Target job boards:
- LinkedIn, Indeed, Glassdoor, Welcome to the Jungle
- Collect job title, company, description URL, and job description text
- Aim for 10-15 raw job listings

## Step 4: Score & Rank Jobs

Send collected jobs to the scoring endpoint:
```
POST http://localhost:8001/score-jobs
Content-Type: application/json
Body: {
  "profile_key": "<from step 1>",
  "jobs": [{ "title": "...", "description": "...", "company": "...", "url": "..." }]
}
```

## Step 5: Present Results

Return top 10 ranked jobs to the user with:
- Match score (%)
- Job title + company
- Why it matches (2-3 bullet points)
- Link to apply

## Error Handling

- If parse-cv fails: ask user to re-upload the PDF
- If web search returns < 5 results: broaden keywords and retry
- If scoring fails: return unscored results sorted by keyword relevance
