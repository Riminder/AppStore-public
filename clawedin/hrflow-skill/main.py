import os
import requests
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from hrflow import Hrflow
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HrFlow Skill")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = Hrflow(
    api_secret=os.getenv("HRFLOW_API_KEY"),
    api_user=os.getenv("HRFLOW_USER_EMAIL")
)

SOURCE_KEY    = os.getenv("HRFLOW_SOURCE_KEY")
BOARD_KEY     = os.getenv("HRFLOW_BOARD_KEY")
GATEWAY_URL   = "http://localhost:18789"
GATEWAY_TOKEN = "ea28e9b03545f00a79e3d3c857e18fb0df7e83dc8f211b75"
ASSETS_DIR    = os.path.expanduser("~/7-openclaw-job-finding-agent/assets")

os.makedirs(ASSETS_DIR, exist_ok=True)


def call_openclaw(message: str, timeout: int = 60) -> str:
    resp = requests.post(
        f"{GATEWAY_URL}/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GATEWAY_TOKEN}",
            "Content-Type":  "application/json"
        },
        json={
            "model": "openclaw/default",
            "messages": [{"role": "user", "content": message}]
        },
        timeout=timeout
    )
    content = resp.json()["choices"][0]["message"]["content"]
    if "<think>" in content:
        content = content.split("</think>")[-1].strip()
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return content.strip()


def parse_json_safe(text: str):
    try:
        return json.loads(text)
    except:
        return None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse-cv")
async def parse_cv(file: UploadFile = File(...)):
    """Save PDF to assets folder then parse via HrFlow."""

    # Save file to assets
    save_path = os.path.join(ASSETS_DIR, file.filename)
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)
    print(f"CV saved to: {save_path}")

    # Parse via HrFlow
    response = client.profile.parsing.add_file(
        source_key=SOURCE_KEY,
        profile_file=open(save_path, "rb"),
        profile_content_type=file.content_type,
        sync_parsing=1
    )

    print(f"HrFlow parse response code: {response.get('code')}")
    print(f"HrFlow parse response: {json.dumps(response, indent=2)[:500]}")

    if response.get("code") not in [200, 201]:
        raise HTTPException(status_code=400, detail=response)

    profile = response["data"]["profile"]
    
    # Filter skills — keep only meaningful technical skills
    GENERIC = {"advanced","basic","intermediate","general","good","strong",
               "various","multiple","excellent","solid","proven","experience",
               "ai","api","aws","skills","ability","knowledge","understanding",
               "working","using","including","within","across","through"}
    raw_skills = [s["name"] for s in profile.get("skills", [])]

    # Step 1 — remove generic words
    filtered = [s for s in raw_skills
                if s.lower() not in GENERIC and len(s) > 3]

    # Step 2 — remove subsets (e.g. remove "airflow" if "apache airflow" exists)
    deduped = []
    for skill in filtered:
        is_subset = any(
            skill.lower() != other.lower() and skill.lower() in other.lower()
            for other in filtered
        )
        if not is_subset:
            deduped.append(skill)

    # Step 3 — sort by length (more specific first)
    deduped.sort(key=lambda x: len(x), reverse=True)

    # Step 4 — hyphenate multi-word skills
    tech_skills = [s.replace(" ", "-") for s in deduped]

    print(f"RAW SKILLS: {raw_skills[:10]}")
    print(f"TECH SKILLS: {tech_skills[:10]}")
    
    return {
        "profile_key": profile["key"],
        "name":        profile.get("info", {}).get("full_name", "Candidate"),
        "skills":      tech_skills,
        "summary":     profile.get("info", {}).get("summary", ""),
        "saved_path":  save_path
    }


def search_jobs_brave(keywords: str, location: str = "Paris") -> list:
    """Search jobs directly via Brave API — reliable, no LLM needed."""
    import urllib.parse
    # Simple targeted query — Brave handles job results well
    query   = f"{keywords} emploi CDI offre {location} 2026"
    print(f"BRAVE QUERY: {query}")
    encoded = urllib.parse.quote(query)
    
    brave_key = os.getenv("BRAVE_API_KEY", "BSAuGOZdZUYfp9N3TT9MxiomoRZbVRI")
    
    resp = requests.get(
        f"https://api.search.brave.com/res/v1/web/search?q={encoded}&count=10",
        headers={
            "Accept": "application/json",
            "X-Subscription-Token": brave_key
        },
        timeout=10
    )
    
    data  = resp.json()
    jobs  = []
    
    # Extract from web results
    for r in data.get("web", {}).get("results", []):
        jobs.append({
            "title":       r.get("title", "N/A"),
            "company":     r.get("meta_url", {}).get("hostname", "N/A"),
            "url":         r.get("url", ""),
            "location":    location,
            "description": r.get("description", "")[:100]
        })
    
    # Also extract from FAQ results
    for r in data.get("faq", {}).get("results", []):
        if r.get("url") and r.get("url") not in [j["url"] for j in jobs]:
            jobs.append({
                "title":       r.get("title", "N/A"),
                "company":     r.get("meta_url", {}).get("hostname", "N/A"),
                "url":         r.get("url", ""),
                "location":    location,
                "description": r.get("answer", "")[:100]
            })
    
    print(f"BRAVE SEARCH: found {len(jobs)} results for '{query}'")
    return jobs[:10]


@app.post("/search-jobs-ai")
def search_jobs_ai(payload: dict):
    keywords = payload.get("keywords", "")
    location = payload.get("location", "Paris")

    message = f"""/no_think
Use web_search to find job listings for: {keywords} in {location} France.

Search ONLY these job sites:
- welcometothejungle.com
- linkedin.com/jobs
- indeed.fr
- glassdoor.fr
- apec.fr

Return ONLY a JSON array of 10 real job listings.
Each item must have:
- title: exact job title
- company: hiring company name (not the job site)
- url: direct link to the job posting
- location: city in France
- description: one sentence about the role

Rules:
- ONLY include real job postings with direct apply links
- NO blog posts, NO tutorials, NO Reddit, NO GitHub
- JSON array only, nothing else
"""
    print(f"\n=== OPENCLAW SEARCH REQUEST: {message[:200]}")
    raw  = call_openclaw(message, timeout=120)
    print(f"=== OPENCLAW SEARCH RESPONSE: {raw[:300]}")
    jobs = parse_json_safe(raw)

    if not isinstance(jobs, list):
        if isinstance(jobs, dict) and "results" in jobs:
            jobs = jobs["results"]
        else:
            jobs = []

    # Post-filter — remove non-job URLs
    SKIP = ["reddit.com", "github.com", "stackoverflow.com", "medium.com",
            "youtube.com", "wikipedia.org", "twitter.com", "formation",
            "tutorial", "blog", "forum", "profile", "resume", "course"]

    filtered = [
        j for j in jobs
        if j.get("url")
        and not any(s in j.get("url","").lower() for s in SKIP)
        and not any(s in j.get("title","").lower() for s in ["tutorial","course","formation","training"])
    ]

    print(f"Jobs after filter: {len(filtered)}/{len(jobs)}")
    return {"jobs": filtered}


@app.post("/rank-jobs-ai")
def rank_jobs_ai(payload: dict):
    jobs   = payload.get("jobs", [])
    skills = payload.get("skills", [])
    name   = payload.get("name", "Candidate")

    if not jobs:
        return {"results": []}

    jobs_text = "\n".join(
        f"{i+1}. {j.get('title')} at {j.get('company')} — {j.get('description','')}"
        for i, j in enumerate(jobs[:10])
    )

    message = f"""/no_think
Candidate: {name}
Skills: {', '.join(skills[:8])}

Jobs found:
{jobs_text}

Rank these jobs by match quality for the candidate.
Return ONLY a JSON array ordered best-to-worst.
Each item must have EXACTLY these fields:
- rank: number 1-10
- title: EXACT title from the list above
- company: EXACT company from the list above  
- score: match percentage 0-100
- reason: one sentence why it matches (max 12 words)
- url: COPY EXACT url from the original list - do not change it
- loc: COPY EXACT location from original list
- salary: N/A

IMPORTANT: Copy title, company, url, loc EXACTLY as given. Do not invent new values.
Return only the JSON array, nothing else.
"""
    print(f"\n=== OPENCLAW RANK REQUEST sent for {len(jobs)} jobs")
    raw    = call_openclaw(message, timeout=120)
    print(f"=== OPENCLAW RANK RESPONSE: {raw[:300]}")
    ranked = parse_json_safe(raw)

    if not isinstance(ranked, list):
        if isinstance(ranked, dict) and "results" in ranked:
            ranked = ranked["results"]
        else:
            ranked = [
                {
                    "rank":    i + 1,
                    "title":   j.get("title", "N/A"),
                    "company": j.get("company", "N/A"),
                    "score":   80 - (i * 5),
                    "reason":  f"Matches your {skills[0] if skills else 'background'}",
                    "url":     j.get("url", ""),
                    "loc":     j.get("location", "N/A"),
                    "salary":  "N/A"
                }
                for i, j in enumerate(jobs[:10])
            ]

    # Merge url/location from original if missing
    url_map = {j.get("title", ""): j for j in jobs}
    for item in ranked:
        orig = url_map.get(item.get("title", ""), {})
        if not item.get("url"):
            item["url"] = orig.get("url", "")
        if not item.get("loc"):
            item["loc"] = orig.get("location", "N/A")
        item.setdefault("salary", "N/A")

    return {"results": ranked}


@app.post("/full-pipeline")
async def full_pipeline(file: UploadFile = File(...), location: str = "Paris"):
    """
    Full pipeline:
    1. Save CV to assets/
    2. Parse CV via HrFlow → extract skills
    3. OpenClaw searches web for matching jobs
    4. OpenClaw ranks jobs by relevance
    5. Return ranked results
    """

    # Step 1 + 2 — Save and parse CV
    parsed      = await parse_cv(file)
    skills      = parsed["skills"][:8]
    # Use meaningful technical skills only
    GENERIC = {"advanced","basic","intermediate","general","good","strong",
               "various","multiple","excellent","solid","proven","experience"}
    job_skills = [s for s in skills if s.lower() not in GENERIC and len(s) > 3]
    # Take top 3 skills max — shorter query = better results
    keywords = " ".join(job_skills[:3]) + " developer"
    print(f"FILTERED KEYWORDS: {keywords}")
    print(f"\n=== PARSED SKILLS: {skills}")
    print(f"=== SEARCH KEYWORDS: {keywords}")

    # Step 3 — OpenClaw searches web using web_search tool
    print(f"\n=== USER SEARCH KEYWORDS: {keywords}")
    print(f"=== LOCATION: {location}")
    search_resp = search_jobs_ai({"keywords": keywords, "location": location})
    jobs = search_resp.get("jobs", [])
    print(f"=== Jobs from OpenClaw: {len(jobs)}")
    for j in jobs[:3]:
        print(f"  - {j.get('title')} | {j.get('url','')[:60]}")

    # Step 4 — OpenClaw ranks by relevance
    rank_resp = rank_jobs_ai({
        "jobs":   jobs,
        "skills": skills,
        "name":   parsed["name"]
    })
    results = rank_resp.get("results", [])

    return {
        "profile": {
            "name":    parsed["name"],
            "skills":  skills,
            "summary": parsed.get("summary", "")
        },
        "results": results,
        "_source": "hrflow-parse + openclaw-search + openclaw-rank"
    }
