import streamlit as st
import requests
import json
import urllib.parse
from core.api import FASTAPI_URL, GATEWAY_URL, GATEWAY_TOKEN

BRAVE_KEY = "BSAuGOZdZUYfp9N3TT9MxiomoRZbVRI"


def generate_job_roles(skills: list) -> list:
    """Ask OpenClaw to suggest relevant job roles from skills."""
    skills_str = ", ".join(skills[:20])
    message = f"""/no_think
Based on these skills: {skills_str}

Generate exactly 5 relevant job role titles this person should apply for.
Return ONLY a JSON array of 5 strings. Example:
["Full-Stack Developer", "Data Engineer", "AI Engineer", "Backend Developer", "DevOps Engineer"]
JSON array only. Nothing else.
"""
    try:
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
            timeout=30
        )
        content_raw = resp.json()["choices"][0]["message"]["content"]
        if "<think>" in content_raw:
            content_raw = content_raw.split("</think>")[-1].strip()
        content_raw = content_raw.strip()
        if content_raw.startswith("```"):
            content_raw = content_raw.split("```")[1]
            if content_raw.startswith("json"):
                content_raw = content_raw[4:]
        roles = json.loads(content_raw.strip())
        if isinstance(roles, list):
            print(f"JOB ROLES: {roles}", flush=True)
            return roles[:5]
    except Exception as e:
        print(f"Role generation failed: {e}", flush=True)
    # Fallback roles
    return ["Full-Stack Developer", "Backend Developer", "Data Engineer",
            "AI Engineer", "Software Engineer"]

def search_jobs_brave(keywords: str, location: str = "Paris", freshness: str = "pm") -> list:
    """Search real jobs via Brave API — fast and reliable."""
    SKIP = ["reddit", "github", "stackoverflow", "medium", "youtube",
            "wikipedia", "twitter", "formation", "tutorial", "blog",
            "forum", "profile", "resume", "course", "reval.site",
            "internshala", "shine.com", "hireitpeople", "in/",
            "fastapi.tiangolo", "docs.", "documentation", "pypi.org",
            "npmjs.com", "readthedocs", "dev.to", "hashnode"]

    all_jobs = []

    # Site-specific queries — tailored for each job platform
    # Search by skills — "apply now" forces job listings not articles
    site_queries = [
        (f"{keywords} offre emploi CDI {location} postuler", "welcometothejungle.com"),
        (f"{keywords} CDI {location} apply now", "linkedin.com"),
        (f"{keywords} emploi CDI {location} postuler", "indeed.fr"),
        (f"{keywords} {location} postuler candidature", "apec.fr"),
        (f"{keywords} apply now job {location}", "glassdoor.fr"),
        (f"{keywords} hiring {location}", "talent.io"),
    ]
    print(f"SEARCH SKILLS: {keywords} in {location}", flush=True)

    # Freshness only applies when not "any time"
    freshness_param = f"&freshness={freshness}" if freshness != "py" else ""

    for query, site in site_queries:
        encoded = urllib.parse.quote(query)
        print(f"BRAVE: searching {site}", flush=True)
        try:
            resp = requests.get(
                f"https://api.search.brave.com/res/v1/web/search?q={encoded}&count=10{freshness_param}",
                headers={
                    "Accept": "application/json",
                    "X-Subscription-Token": BRAVE_KEY
                },
                timeout=8
            )
            data = resp.json()
            for r in data.get("web", {}).get("results", []):
                url  = r.get("url", "")
                # Skip LinkedIn profiles — only keep /jobs/ URLs
                if "linkedin.com" in url and "/jobs/" not in url and "/job/" not in url:
                    continue
                if any(s in url.lower() for s in SKIP):
                    continue
                all_jobs.append({
                    "title":       r.get("title", "N/A"),
                    "company":     r.get("meta_url", {}).get("hostname", site),
                    "url":         url,
                    "location":    location,
                    "description": r.get("description", "")[:150]
                })
        except Exception as e:
            print(f"Brave {site} failed: {e}", flush=True)
            continue

    # Deduplicate
    seen   = set()
    unique = []
    for j in all_jobs:
        if j["url"] not in seen:
            seen.add(j["url"])
            unique.append(j)

    print(f"BRAVE TOTAL: {len(unique)} jobs found", flush=True)
    for j in unique[:5]:
        print(f"  - {j['title']} | {j['url'][:70]}", flush=True)
    return unique[:50]


def rank_jobs_openclaw(jobs: list, skills: list, name: str) -> list:
    """OpenClaw ranks jobs — with fallback scoring."""
    if not jobs:
        return []

    jobs_text = "\n".join(
        f"{i+1}. {j.get('title')} | {j.get('company')} | {j.get('url')}"
        for i, j in enumerate(jobs[:20])
    )

    message = f"""/no_think
Candidate skills: {', '.join(skills[:6])}

Rank ALL these {min(len(jobs),20)} jobs by match quality:
{jobs_text}

Return ALL jobs as JSON array ranked best to worst:
[{{"rank":1,"title":"exact","company":"exact","score":85,"reason":"why matches","url":"exact","loc":"Paris","salary":"N/A"}}]
Every job must appear. JSON array only.
"""
    try:
        resp = requests.post(
            f"{GATEWAY_URL}/v1/chat/completions",
            headers={{
                "Authorization": f"Bearer {{GATEWAY_TOKEN}}",
                "Content-Type":  "application/json"
            }},
            json={{
                "model": "openclaw/default",
                "messages": [{{"role": "user", "content": message}}]
            }},
            timeout=60
        )
        content_raw = resp.json()["choices"][0]["message"]["content"]
        print(f"OPENCLAW RANK RAW: {{content_raw[:300]}}", flush=True)

        if "<think>" in content_raw:
            content_raw = content_raw.split("</think>")[-1].strip()
        content_raw = content_raw.strip()
        if content_raw.startswith("```"):
            content_raw = content_raw.split("```")[1]
            if content_raw.startswith("json"):
                content_raw = content_raw[4:]
        content_raw = content_raw.strip()

        ranked = json.loads(content_raw)
        if isinstance(ranked, dict) and "results" in ranked:
            ranked = ranked["results"]
        if not isinstance(ranked, list) or len(ranked) < 2:
            raise ValueError(f"Only {len(ranked) if isinstance(ranked,list) else 0} results")

        # Merge exact URLs + fix scores
        url_map = {{j.get("title","").lower(): j for j in jobs}}
        for item in ranked:
            orig = url_map.get(item.get("title","").lower(), {{}})
            if not item.get("url") or item["url"] in ["N/A",""]:
                item["url"] = orig.get("url","")
            item.setdefault("loc", "Paris")
            item.setdefault("salary","N/A")
            if not item.get("score") or item["score"] == 0:
                item["score"] = max(60, 90 - (item.get("rank",1) * 3))
        return ranked

    except Exception as e:
        print(f"OpenClaw rank failed: {{e}} — using keyword fallback", flush=True)

    # Fallback — keyword-based scoring
    def simple_score(job, skills):
        title = job.get("title","").lower()
        desc  = job.get("description","").lower()
        hits  = sum(1 for s in skills if s.lower().replace("-"," ") in title or
                                         s.lower().replace("-"," ") in desc)
        return min(95, 60 + (hits * 8))

    scored = []
    for i, j in enumerate(jobs[:50]):
        score = simple_score(j, skills)
        matching = [s for s in skills[:3]
                    if s.lower().replace("-"," ") in j.get("title","").lower()
                    or s.lower().replace("-"," ") in j.get("description","").lower()]
        scored.append({
            "rank":    i+1,
            "title":   j.get("title","N/A"),
            "company": j.get("company","N/A"),
            "score":   score,
            "reason":  f"Matches: {', '.join(matching)}" if matching else "Relevant to your profile",
            "url":     j.get("url",""),
            "loc":     j.get("location","Paris"),
            "salary":  "N/A"
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scored):
        s["rank"] = i + 1
    return scored


def render():
    st.header("Step 3: AI Job Search")

    keywords = st.session_state.get("search_keywords", "")
    location = st.session_state.get("search_location", "Paris")
    parsed   = st.session_state.get("parsed_cv", {})
    skills   = parsed.get("skills", [])
    name     = parsed.get("name", "Candidate")

    # If results cached — just show button
    if st.session_state.get("results"):
        st.success(f"🎯 {len(st.session_state.results)} jobs found and ranked!")
        with st.container(border=True):
            st.caption("🔍 Searched for")
            st.markdown(f"**{keywords}** in **{location}**")
        if st.button("Review My Ranked Matches →", type="primary", use_container_width=True):
            st.session_state.step = "results"
            st.rerun()
        return

    with st.container(border=True):
        st.caption("🔍 Searching for")
        st.markdown(f"**{keywords}** in **{location}**")
    with st.status("🦞 Searching jobs...", expanded=True) as status_box:
        import re as _re

        # Step 1 — OpenClaw generates job roles from skills
        st.write("🤖 OpenClaw analysing your skills...")
        job_roles = st.session_state.get("job_roles", [])
        if not job_roles:
            job_roles = generate_job_roles(skills)
            st.session_state.job_roles = job_roles
        clean_roles = [_re.sub(r"\(.*?\)", "", r).strip() for r in job_roles[:5]]
        st.write(f"✅ Roles: {", ".join(clean_roles)}")

        # Step 2 — Brave searches each role
        st.write("🌐 Brave Search scanning job sites...")
        all_jobs = []
        freshness = st.session_state.get("search_freshness", "py")
        for role in clean_roles:
            role_jobs = search_jobs_brave(f"{role} jobs apply now", location, freshness=freshness)
            all_jobs.extend(role_jobs)
        seen = set()
        jobs = []
        for j in all_jobs:
            if j["url"] not in seen:
                seen.add(j["url"])
                jobs.append(j)
        print(f"TOTAL JOBS: {len(jobs)}", flush=True)

        if not jobs:
            status_box.update(label="❌ No jobs found", state="error")
            st.error("No jobs found. Try different keywords.")
            if st.button("← Try different keywords"):
                st.session_state.step = "keywords"
                st.rerun()
            return

        st.write(f"✅ Found {len(jobs)} listings")
        st.write("🦞 OpenClaw ranking by relevance...")
        ranked = rank_jobs_openclaw(jobs, skills, name)
        status_box.update(
            label=f"✅ {len(ranked)} jobs ranked by OpenClaw!",
            state="complete",
            expanded=False
        )

    normalised = []
    for job in ranked:
        normalised.append({
            "title":   job.get("title","N/A"),
            "company": job.get("company","N/A"),
            "score":   job.get("score",0),
            "loc":     job.get("loc","N/A"),
            "salary":  job.get("salary","N/A"),
            "source":  "OpenClaw",
            "reason":  job.get("reason",""),
            "url":     job.get("url","")
        })
    st.session_state.results = normalised

    if normalised:
        st.success(f"🎯 {len(normalised)} jobs found!")
        if st.button("Review My Ranked Matches →", type="primary", use_container_width=True):
            st.session_state.step = "results"
            st.rerun()
