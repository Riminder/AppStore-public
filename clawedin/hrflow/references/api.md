# HrFlow FastAPI Endpoints

Base URL: http://localhost:8001

## POST /parse-cv
Parse a CV PDF into a structured profile.

**Request:** multipart/form-data
- `file`: PDF file

**Response:**
```json
{
  "profile_key": "string",
  "info": {
    "full_name": "string",
    "email": "string",
    "location": {}
  },
  "skills": [{ "name": "string", "value": "string" }],
  "experiences": [{ "title": "string", "company": "string", "description": "string" }],
  "educations": [{ "school": "string", "title": "string" }]
}
```

## POST /score-jobs
Score and rank job listings against a parsed profile.

**Request:** application/json
```json
{
  "profile_key": "string",
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "description": "string",
      "url": "string"
    }
  ]
}
```

**Response:**
```json
{
  "ranked_jobs": [
    {
      "title": "string",
      "company": "string",
      "url": "string",
      "score": 0.95,
      "reasons": ["string"]
    }
  ]
}
```

## GET /health
Returns `{"status": "ok"}` if the service is running.
