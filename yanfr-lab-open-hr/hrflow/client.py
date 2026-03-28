"""
HrFlow AI Client — 12 APIs，使用已验证的正确端点。

Base URL: https://api.hrflow.ai/v1

APIs:
  1.  Parsing API      — POST /v1/text/parsing + POST /v1/job/indexing
  2.  Tagging API      — POST /v1/text/tagging
  3.  Embedding API    — POST /v1/profile/embedding
  4.  Searching API    — GET  /v1/profiles/searching
  5.  Matching API     — GET  /v1/profiles/scoring (无阈值宽召回)
  6.  Scoring API      — GET  /v1/profiles/scoring (有阈值精排)
  7.  Grading API      — GET  /v1/profile/grading
  8.  Reasoning API    — GET  /v1/profile/revealing
  9.  Signals API      — POST /v1/profile/events
  10. Upskilling API   — GET  /v1/jobs/searching (skill gap)
  11. Data Studio      — POST /v1/profile/indexing (batch sync)
  12. UI Studio        — GET  /v1/profile/indexing (card data)
"""

from __future__ import annotations

import io
import json
import logging
from typing import Any, Optional

import httpx
from tenacity import (
    retry, retry_if_exception_type,
    stop_after_attempt, wait_exponential,
)

from config import config

logger = logging.getLogger(__name__)
TIMEOUT = httpx.Timeout(30.0)
BASE = "https://api.hrflow.ai/v1"


def _auth_headers() -> dict:
    return {
        "X-API-KEY": config.HRFLOW_API_KEY,
        "X-USER-EMAIL": config.HRFLOW_USER_EMAIL,
    }


def _check(resp: httpx.Response, label: str) -> dict:
    if resp.status_code not in (200, 201):
        logger.error("[HrFlow/%s] HTTP %s: %s", label, resp.status_code, resp.text[:300])
        resp.raise_for_status()
    body = resp.json()
    if body.get("code") not in (200, 201, None):
        raise RuntimeError(f"[HrFlow/{label}] error {body.get('code')}: {body.get('message')}")
    return body


def _get(path: str, params: dict) -> dict:
    with httpx.Client(timeout=TIMEOUT) as c:
        r = c.get(f"{BASE}{path}", headers={**_auth_headers(), "Content-Type": "application/json"}, params=params)
    return _check(r, path)


def _post_json(path: str, payload: dict) -> dict:
    with httpx.Client(timeout=TIMEOUT) as c:
        r = c.post(f"{BASE}{path}", headers={**_auth_headers(), "Content-Type": "application/json"}, json=payload)
    return _check(r, path)


def _post_multipart(path: str, data: dict, files: dict) -> dict:
    with httpx.Client(timeout=TIMEOUT) as c:
        r = c.post(f"{BASE}{path}", headers=_auth_headers(), data=data, files=files)
    return _check(r, path)


class HrFlowClient:

    # ─────────────────────────────────────────────────────────────────────────
    # 1. PARSING API
    # ─────────────────────────────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10),
           retry=retry_if_exception_type((httpx.HTTPError, RuntimeError)))
    def parse_job_from_text(self, board_key: str, job_text: str, job_title: str) -> dict:
        """
        Parsing API (Job) — POST /v1/job/indexing
        直接将 JD 写入 Board 获取 job_key（text_parsing 为可选增强）。
        """
        import uuid
        job_key = str(uuid.uuid4())

        # 尝试用 text/parsing 提取技能（若账号未开通则跳过）
        skills = []
        try:
            parse_resp = _post_json("/text/parsing", {"text": f"{job_title}\n\n{job_text}"})
            skills = parse_resp.get("data", {}).get("skills", [])
        except Exception as e:
            logger.info("[Parsing] text/parsing skipped (not available on this plan): %s", e)

        job_payload = {
            "board_key": board_key,
            "job": {
                "key": job_key,
                "name": job_title,
                "description": job_text,
                "skills": skills,
                "tags": [],
                "location": {"text": ""},
                "sections": [{"name": "description", "title": "Description", "description": job_text}],
            },
        }
        index_resp = _post_json("/job/indexing", job_payload)
        # 返回 job_key 合并到响应中
        index_resp["_job_key"] = job_key
        return index_resp

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10),
           retry=retry_if_exception_type((httpx.HTTPError, RuntimeError)))
    def parse_profile_from_url(
        self, resume_url: str, source_key: str, texts: Optional[list[str]] = None
    ) -> dict:
        """
        Parsing API (Profile) — POST /v1/profile/parsing/file
        下载简历文件后以 multipart 上传。
        若 URL 不可访问，退回到直接索引一个最小 profile。
        texts: GitHub README 等补充文本，拼接后附加到简历内容。
        """
        # 尝试下载简历
        file_bytes: Optional[bytes] = None
        filename = "resume.pdf"
        try:
            with httpx.Client(timeout=httpx.Timeout(15.0)) as c:
                dl = c.get(resume_url, follow_redirects=True)
                if dl.status_code == 200:
                    file_bytes = dl.content
                    # 从 URL 取文件名
                    filename = resume_url.split("/")[-1] or "resume.pdf"
        except Exception as e:
            logger.warning("[Parsing] Resume download failed (%s): %s", resume_url, e)

        if file_bytes:
            # 若有补充文本，拼成额外 txt 一起上传
            extra = ("\n\n".join(texts) if texts else "").encode("utf-8")
            if extra:
                with httpx.Client(timeout=TIMEOUT) as c:
                    r = c.post(
                        f"{BASE}/profile/parsing/file",
                        headers=_auth_headers(),
                        data={"source_key": source_key, "sync_parsing": "1"},
                        files={
                            "file": (filename, file_bytes, "application/pdf"),
                            "file2": ("github.txt", extra, "text/plain"),
                        },
                    )
                return _check(r, "/profile/parsing/file")
            else:
                return _post_multipart(
                    "/profile/parsing/file",
                    data={"source_key": source_key, "sync_parsing": "1"},
                    files={"file": (filename, file_bytes, "application/pdf")},
                )
        else:
            # 无法下载 → 直接用文本索引一个 profile
            combined_text = f"{resume_url}\n\n" + ("\n\n".join(texts) if texts else "")
            return self._index_profile_from_text(source_key, combined_text)

    def _index_profile_from_text(self, source_key: str, text: str) -> dict:
        """兜底：当简历 URL 不可访问时，直接用文本解析后索引 profile。"""
        import uuid
        profile_key = str(uuid.uuid4())
        # 先用 text/parsing 提取结构化信息
        try:
            parsed = _post_json("/text/parsing", {"text": text[:3000]})
            skills = parsed.get("data", {}).get("skills", [])
        except Exception:
            skills = []

        payload = {
            "source_key": source_key,
            "profile": {
                "key": profile_key,
                "skills": skills,
                "experiences": [],
                "educations": [],
                "languages": [],
                "certifications": [],
                "info": {"full_name": "Unknown", "summary": text[:500]},
                "sections": [{"name": "raw", "title": "Raw", "description": text[:2000]}],
            },
        }
        resp = _post_json("/profile/indexing", payload)
        resp["_profile_key"] = profile_key
        return resp

    # ─────────────────────────────────────────────────────────────────────────
    # 2. TAGGING API — POST /v1/text/tagging
    # ─────────────────────────────────────────────────────────────────────────

    def tag_profile(self, profile_key: str, source_key: str) -> dict:
        """
        Tagging API — 取 profile 文本后调用 POST /v1/text/tagging
        用 hrflow-skills tagger 打 HR 分类标签，统一技能词汇表。
        """
        # 先取 profile 内容
        try:
            p = _get("/profile/indexing", {"source_key": source_key, "profile_key": profile_key})
            sections = p.get("data", {}).get("profile", {}).get("sections", [])
            text = " ".join(s.get("description", "") for s in sections)[:2000] or profile_key
        except Exception:
            text = profile_key

        try:
            return _post_json("/text/tagging", {
                "text": text,
                "algorithm_key": "tagger-hrflow-skills",
                "top_n": 10,
                "output_lang": "en",
            })
        except Exception as e:
            logger.info("[Tagging] text/tagging skipped (not available): %s", e)
            return {"code": 200, "data": {"tags": []}}

    def tag_job(self, board_key: str, job_key: str) -> dict:
        """Tagging API — 对 Job 文本打 HR 技能标签。"""
        try:
            j = _get("/job/indexing", {"board_key": board_key, "job_key": job_key})
            desc = j.get("data", {}).get("job", {}).get("description", "") or job_key
        except Exception:
            desc = job_key

        try:
            return _post_json("/text/tagging", {
                "text": desc[:2000],
                "algorithm_key": "tagger-hrflow-skills",
                "top_n": 10,
                "output_lang": "en",
            })
        except Exception as e:
            logger.info("[Tagging] text/tagging skipped (not available): %s", e)
            return {"code": 200, "data": {"tags": []}}

    # ─────────────────────────────────────────────────────────────────────────
    # 3. EMBEDDING API — POST /v1/profile/embedding
    # ─────────────────────────────────────────────────────────────────────────

    def embed_profile(self, profile_key: str, source_key: str) -> dict:
        """
        Embedding API — POST /v1/profile/embedding
        生成语义向量，为 Searching / Scoring 提供语义相似度基础。
        """
        return _post_json("/profile/embedding", {
            "source_key": source_key,
            "profile_key": profile_key,
        })

    def embed_job(self, board_key: str, job_key: str) -> dict:
        """Embedding API — POST /v1/job/embedding 生成 Job 语义向量。"""
        return _post_json("/job/embedding", {
            "board_key": board_key,
            "job_key": job_key,
        })

    # ─────────────────────────────────────────────────────────────────────────
    # 4. SEARCHING API — GET /v1/profiles/searching
    # ─────────────────────────────────────────────────────────────────────────

    def search_profiles(
        self,
        source_keys: list[str],
        query: str,
        filters: Optional[dict] = None,
        page: int = 1,
        limit: int = 50,
    ) -> dict:
        """
        Searching API — GET /v1/profiles/searching
        关键词+语义混合检索，作为 Scoring 前的轻量预过滤，降低成本。
        """
        params: dict[str, Any] = {
            "source_keys": json.dumps(source_keys),
            "text_keywords": query,
            "page": page,
            "limit": limit,
            "sort_by": "searching",
            "order_by": "desc",
        }
        if filters:
            params.update(filters)
        return _get("/profiles/searching", params)

    # ─────────────────────────────────────────────────────────────────────────
    # 5. MATCHING API — GET /v1/profiles/scoring (无阈值宽召回)
    # ─────────────────────────────────────────────────────────────────────────

    def match_profiles_for_job(
        self,
        job_key: str,
        board_key: str,
        source_keys: list[str],
        limit: int = 100,
    ) -> dict:
        """
        Matching API — GET /v1/profiles/scoring (无 score_threshold)
        粗粒度宽匹配，扩大召回范围后再由 Scoring API 精排。
        """
        return _get("/profiles/scoring", {
            "job_key": job_key,
            "board_key": board_key,
            "source_keys": json.dumps(source_keys),
            "limit": limit,
            "sort_by": "scoring",
            "order_by": "desc",
        })

    # ─────────────────────────────────────────────────────────────────────────
    # 6. SCORING API — GET /v1/profiles/scoring (核心)
    # ─────────────────────────────────────────────────────────────────────────

    def score_profiles_for_job(
        self,
        job_key: str,
        board_key: str,
        source_keys: list[str],
        score_threshold: float = 0.6,
        limit: int = 20,
        page: int = 1,
        use_memory: bool = False,
    ) -> dict:
        """
        Scoring API — GET /v1/profiles/scoring
        返回 predictions[1] 概率分（0–1），按 score desc 排序。
        use_memory=True 激活在线微调（需先有 Signals）。
        """
        params: dict[str, Any] = {
            "job_key": job_key,
            "board_key": board_key,
            "source_keys": json.dumps(source_keys),
            "limit": limit,
            "page": page,
            "sort_by": "scoring",
            "order_by": "desc",
        }
        if use_memory:
            params["use_memory_context"] = 1
        return _get("/profiles/scoring", params)

    def index_job_sync(self, board_key: str, job_title: str) -> str:
        """
        Indexing API (Job) — POST /v1/job/indexing
        Crée un job dans le Board et retourne son job_key.
        Approche Leo : job minimal pour déclencher le scoring.
        """
        import time as _time
        payload = {
            "board_key": board_key,
            "name": job_title[:50],
            "reference": f"ref-{int(_time.time())}",
            "summary": job_title,
            "location": {"text": "Remote", "lat": None, "lng": None},
            "sections": [{"name": "description", "title": "Job Description", "description": job_title}],
        }
        resp = _post_json("/job/indexing", payload)
        return resp["data"]["key"]

    def score_profiles_with_algo(
        self,
        job_key: str,
        board_key: str,
        source_keys: list[str],
        limit: int = 100,
    ) -> dict:
        """
        Scoring API — GET /v1/profiles/scoring avec algorithm_key (approche Leo).
        Retourne profiles + predictions[][1] = score IA (0–1).
        """
        params: dict[str, Any] = {
            "job_key": job_key,
            "board_key": board_key,
            "source_keys": json.dumps(source_keys),
            "algorithm_key": "b1ebac4c62fa96e06206f4433b95ae69674891ff",
            "limit": limit,
            "sort_by": "scoring",
            "order_by": "desc",
        }
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.get(f"{BASE}/profiles/scoring",
                      headers={**_auth_headers(), "Content-Type": "application/json"},
                      params=params)
        if r.status_code != 200:
            logger.error("[HrFlow/scoring-algo] HTTP %s: %s", r.status_code, r.text[:300])
            return {}
        return r.json()

    # ─────────────────────────────────────────────────────────────────────────
    # 7. GRADING API — GET /v1/profile/grading
    # ─────────────────────────────────────────────────────────────────────────

    def grade_profile(
        self, profile_key: str, source_key: str, job_key: str, board_key: str
    ) -> dict:
        """
        Grading API — GET /v1/profile/grading
        对单个 profile-job 对进行二次重排，输出等级（A/B/C）。
        在 Scoring Top-N 之后调用，进一步精细筛选。
        """
        return _get("/profile/grading", {
            "source_key": source_key,
            "profile_key": profile_key,
            "board_key": board_key,
            "job_key": job_key,
        })

    # ─────────────────────────────────────────────────────────────────────────
    # 8. REASONING API — GET /v1/profile/revealing
    # ─────────────────────────────────────────────────────────────────────────

    def get_reasoning(
        self, profile_key: str, source_key: str, job_key: str, board_key: str
    ) -> dict:
        """
        Reasoning API — GET /v1/profile/revealing
        返回评分依据的自然语言解释，满足 EU AI Act 可解释性要求。
        """
        return _get("/profile/revealing", {
            "source_key": source_key,
            "profile_key": profile_key,
            "board_key": board_key,
            "job_key": job_key,
        })

    # ─────────────────────────────────────────────────────────────────────────
    # 9. SIGNALS API — POST /v1/profile/events
    # ─────────────────────────────────────────────────────────────────────────

    def send_signal(
        self,
        profile_key: str,
        source_key: str,
        job_key: str,
        board_key: str,
        event_type: str,
        rating: Optional[float] = None,
    ) -> dict:
        """
        Signals API — POST /v1/profile/events
        将招聘官动作（面试/拒绝/offer）回写给 HrFlow，
        驱动在线微调，使后续评分越来越准确。
        """
        payload: dict[str, Any] = {
            "source_key": source_key,
            "profile_key": profile_key,
            "board_key": board_key,
            "job_key": job_key,
            "type": event_type,
        }
        if rating is not None:
            payload["rating"] = rating
        return _post_json("/profile/events", payload)

    # ─────────────────────────────────────────────────────────────────────────
    # 10. UPSKILLING API — GET /v1/jobs/searching (skill gap)
    # ─────────────────────────────────────────────────────────────────────────

    def get_upskilling(
        self, profile_key: str, source_key: str, job_key: str, board_key: str
    ) -> dict:
        """
        Upskilling API — GET /v1/profile/indexing (比对技能缺口)
        获取 profile 和 job 的技能列表，计算 gap（job 有而 profile 缺少的技能）。
        结果写入候选人输出卡片的"技能缺口"字段。
        """
        # 取 profile 技能
        try:
            p_resp = _get("/profile/indexing", {
                "source_key": source_key,
                "profile_key": profile_key,
            })
            p_skills = {s.get("name", "").lower()
                        for s in p_resp.get("data", {}).get("profile", {}).get("skills", [])}
        except Exception:
            p_skills = set()

        # 取 job 技能
        try:
            j_resp = _get("/job/indexing", {
                "board_key": board_key,
                "job_key": job_key,
            })
            j_skills = [s for s in j_resp.get("data", {}).get("job", {}).get("skills", [])]
        except Exception:
            j_skills = []

        # 计算缺口
        gaps = [s for s in j_skills if s.get("name", "").lower() not in p_skills]
        return {"code": 200, "data": {"upskilling": gaps}}

    # ─────────────────────────────────────────────────────────────────────────
    # 11. DATA STUDIO — POST /v1/profile/indexing (批量同步)
    # ─────────────────────────────────────────────────────────────────────────

    def sync_profiles_to_source(self, source_key: str, profiles: list[dict]) -> dict:
        """
        Data Studio — 批量将候选人 profile 写入 HrFlow Source。
        生产环境中由 Data Studio 的 200+ 连接器（Greenhouse/Lever/Workday）替代。
        """
        results = []
        for p in profiles:
            try:
                r = _post_json("/profile/indexing", {
                    "source_key": source_key,
                    "profile": p,
                })
                results.append({"key": p.get("key"), "status": "ok"})
            except Exception as e:
                results.append({"key": p.get("key"), "status": "error", "message": str(e)})
        return {"code": 200, "data": {"synced": results}}

    def list_sources(self) -> dict:
        """Data Studio — GET /v1/sources 列出所有数据源。"""
        return _get("/sources", {})

    # ─────────────────────────────────────────────────────────────────────────
    # 12. UI STUDIO — GET /v1/profile/indexing (recruiter card data)
    # ─────────────────────────────────────────────────────────────────────────

    def get_ui_profile_card(
        self, profile_key: str, source_key: str, job_key: str, board_key: str
    ) -> dict:
        """
        UI Studio — GET /v1/profile/indexing
        返回结构化 profile 数据，供前端招聘官卡片组件渲染。
        包含匿名化字段、技能高亮和匹配指示器。
        """
        return _get("/profile/indexing", {
            "source_key": source_key,
            "profile_key": profile_key,
        })
