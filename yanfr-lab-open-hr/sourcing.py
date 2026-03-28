import httpx
import asyncio
import re


async def search_candidates(query: str, n: int = 30) -> list[dict]:
    query_lower = query.lower()
    role = "developer"
    skills = []

    if "python" in query_lower: skills.append("python")
    if "react" in query_lower or "frontend" in query_lower:
        skills.append("react")
        role = "frontend-developer"

    search_queries = [f"{role} {' '.join(skills)}", f"{role} engineer"]
    all_candidates = {}

    async with httpx.AsyncClient(timeout=10.0) as client:
        for sq in search_queries:
            try:
                url = f"https://api.github.com/search/users?q={sq}+in:bio+type:user&per_page=15"
                headers = {"Accept": "application/vnd.github+json", "User-Agent": "SourcingAgent/1.0"}
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200: continue

                for item in resp.json().get("items", []):
                    login = item["login"]
                    if login in all_candidates: continue
                    await asyncio.sleep(0.1)
                    u_resp = await client.get(f"https://api.github.com/users/{login}", headers=headers)
                    if u_resp.status_code == 200:
                        u = u_resp.json()
                        all_candidates[login] = {
                            "name": u.get("name") or u.get("login"),
                            "headline": (u.get("bio") or "")[:200],
                            "location": u.get("location") or "Remote",
                            "profile_url": u["html_url"],
                            "source_platform": "github",
                            "avatar_url": u.get("avatar_url"),
                            "company": u.get("company") or "",
                            "raw_text": f"{u.get('name')} {u.get('bio')} {u.get('location')}"
                        }
            except: pass
            if len(all_candidates) >= n: break
    return list(all_candidates.values())[:n]