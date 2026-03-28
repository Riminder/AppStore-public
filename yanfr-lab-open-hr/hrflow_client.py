import os
import httpx
import hashlib
import time
from dotenv import load_dotenv
import asyncio

load_dotenv()

API_KEY = os.getenv("HRFLOW_API_KEY")
USER_EMAIL = os.getenv("HRFLOW_USER_EMAIL")
SOURCE_KEY = os.getenv("HRFLOW_SOURCE_KEY")
BOARD_KEY = os.getenv("HRFLOW_BOARD_KEY")

HEADERS = {"X-API-KEY": API_KEY, "X-USER-EMAIL": USER_EMAIL, "Content-Type": "application/json"}
BASE_URL = "https://api.hrflow.ai/v1"


async def index_job(query: str) -> str:
    async with httpx.AsyncClient() as client:
        import time
        payload = {
            "board_key": BOARD_KEY,
            "name": query[:50],
            "reference": f"ref-{int(time.time())}",
            "summary": query,
            "location": {
                "text": "Remote",  # 必须包含此字段
                "lat": None,
                "lng": None
            },
            "sections": [
                {
                    "name": "description",
                    "title": "Job Description",
                    "description": query
                }
            ]
        }

        print(f"正在请求 HrFlow API... Board Key: {BOARD_KEY}")

        resp = await client.post(
            f"{BASE_URL}/job/indexing",
            json=payload,
            headers=HEADERS
        )

        if resp.status_code not in [200, 201]:
            print("--- HrFlow API 返回了错误 ---")
            print(f"状态码: {resp.status_code}")
            print(f"详细错误内容: {resp.text}")
            print("----------------------------")
            raise Exception(f"HrFlow 报错: {resp.text}")

        return resp.json()["data"]["key"]

async def index_profile(candidate: dict) -> str:
    ref = hashlib.md5(candidate['profile_url'].encode()).hexdigest()[:16]
    payload = {"source_key": SOURCE_KEY, "reference": ref, "info": {"full_name": candidate['name'], "location": {"text": candidate['location']}, "urls": [{"type": "from_resume", "url": candidate['profile_url']}], "summary": candidate['headline'], "picture": candidate['avatar_url']}, "text": candidate['raw_text']}
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/profile/indexing", json=payload, headers=HEADERS)
        return resp.json()["data"]["key"] if resp.status_code != 409 else resp.json()["data"]["key"]


async def score_profiles(job_key: str, limit: int = 10):
    params = {
        "board_key": BOARD_KEY,
        "job_key": job_key,
        "source_keys": f'["{SOURCE_KEY}"]',  # 必须是这种 ["key"] 的格式
        "algorithm_key": 'b1ebac4c62fa96e06206f4433b95ae69674891ff',
        "limit": limit,
        "sort_by": "scoring",
        "order_by": "desc"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{BASE_URL}/profiles/scoring", params=params, headers=HEADERS)

        if resp.status_code == 200:
            # --- 关键：返回整个 JSON 字典 ---
            return resp.json()
        else:
            print(f"❌ API报错: {resp.status_code}")
            return {}

async def explain_profile(job_key: str, profile_key: str) -> str:
    params = {"board_key": BOARD_KEY, "job_key": job_key, "source_key": SOURCE_KEY, "profile_key": profile_key}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{BASE_URL}/profile/explaining", params=params, headers=HEADERS, timeout=2.0)
            return resp.json()["data"]["explanation"]
        except: return ""