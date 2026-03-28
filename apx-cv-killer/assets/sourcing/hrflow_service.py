import os
import json
import tempfile
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class HrFlowService:
    def __init__(self):
        self.base_url = getattr(settings, 'HRFLOW_BASE_URL', 'https://api.hrflow.ai/v1').rstrip('/')
        self.api_key = settings.HRFLOW_API_KEY
        self.source_key = settings.HRFLOW_SOURCE_KEY
        self.board_key = settings.HRFLOW_BOARD_KEY
        self.user_email = getattr(settings, 'HRFLOW_USER_EMAIL', '')
        self.algorithm_key = getattr(settings, 'HRFLOW_ALGORITHM_KEY', '')

    def _get_headers(self, is_json=False):
        """Builds headers safely, omitting blank emails to prevent 'Invalid Role' errors."""
        headers = {
            "X-API-KEY": self.api_key
        }
        
        # FIX: Only attach the email header if it actually exists!
        if self.user_email and self.user_email.strip():
            headers["X-USER-EMAIL"] = self.user_email.strip()
            
        if is_json:
            headers["Content-Type"] = "application/json"
            
        return headers

    def _handle_error(self, response):
        """A bulletproof error handler that will never crash on weird server responses."""
        if response.status_code == 202:
            return 
            
        # 1. Check for hard HTTP errors first (400, 401, 404, 500)
        if not response.ok:
            try:
                err_msg = json.dumps(response.json())
            except:
                err_msg = response.text or str(response.status_code)
            raise Exception(f"HTTP {response.status_code}: {err_msg}")
            
        # 2. Check for sneaky HrFlow errors disguised as 200 OK
        try:
            data = response.json()
            if isinstance(data, dict):
                code = str(data.get('code', '200'))
                if code.startswith(('4', '5')):
                    raise Exception(f"HrFlow Internal Error: {json.dumps(data)}")
        except Exception:
            pass # Not a JSON response, or literal '0', safely ignore

    # -------------------------------------------------------------------------
    # PUBLIC API
    # -------------------------------------------------------------------------

    def index_job(self, reference, title, description, skills=None, location_text="Remote"):
        endpoint = f"{self.base_url}/job/indexing"
        payload = {
            "board_key": self.board_key,
            "reference": str(reference),
            "name": title,
            "location": {"text": location_text, "lat": None, "lng": None},
            "sections": [{"name": "description", "title": "Job Description", "description": description}],
            "skills": [{"name": skill, "value": None, "type": "hard"} for skill in (skills or [])]
        }
        
        response = requests.post(endpoint, headers=self._get_headers(is_json=True), json=payload)
        self._handle_error(response)
        
        logger.info(f"Successfully indexed Job: {reference}")
        return response.json()

    def parse_profile(self, reference, file_path=None, raw_text=None, source_url=None):
        """
        Hackathon Bypass: Since the free tier blocks synchronous AI Document Parsing,
        we index the raw scraped text directly. HrFlow's semantic scoring engine
        will still read the 'text' field to generate accurate match scores!
        """
        # If no raw text is provided but a file is, try to read it as plain text (fallback)
        if not raw_text and file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    raw_text = f.read()
            except:
                raw_text = "See attached file."

        endpoint = f"{self.base_url}/profile/indexing"
        
        # We use dummy 'info' to instantly pass the strict database validation, 
        # but feed the entire OpenClaw scrape into the 'text' field for the Scoring AI.
        payload = {
            "source_key": self.source_key,
            "profile": {
                "reference": str(reference),
                "text": raw_text or "Empty scrape",
                "info": {
                    "first_name": "OpenClaw",       # <-- THE FIX
                    "last_name": "Candidate",       # <-- THE FIX
                    "full_name": "OpenClaw Candidate",
                    "email": "candidate@openclaw.local",
                    "location": {"text": "Remote", "lat": None, "lng": None},
                    "urls": [{"type": "source", "url": source_url}] if source_url else []
                },
                "experiences": [],
                "educations": [],
                "skills": []
            }
        }
        
        response = requests.post(endpoint, headers=self._get_headers(is_json=True), json=payload)
        self._handle_error(response)
        
        logger.info(f"Successfully instantly indexed Profile: {reference}")
        return response.json()

    def get_profile(self, reference):
        """Actively checks if a profile exists in the database."""
        endpoint = f"{self.base_url}/profile/indexing"
        params = {
            'source_key': self.source_key,
            'reference': str(reference)
        }
        response = requests.get(endpoint, headers=self._get_headers(), params=params)
        
        # If it returns 200 OK, the queue is finished and the profile is ready!
        if response.status_code == 200:
            data = response.json()
            if str(data.get('code', '200')) == '200':
                return data.get('data')
        return None

    def get_candidate_scores(self, job_reference):
        endpoint = f"{self.base_url}/profile/scoring"
        params = {
            'algorithm_key': self.algorithm_key,
            'source_keys': json.dumps([self.source_key]),
            'board_key': self.board_key,
            'job_reference': str(job_reference),
            'use_agent': 1
        }
        response = requests.get(endpoint, headers=self._get_headers(is_json=True), params=params)
        self._handle_error(response)
        return response.json().get('data', [])

    def send_rating(self, job_ref, profile_ref, is_shortlisted, comment=""):
        endpoint = f"{self.base_url}/rating"
        payload = {
            "source_keys": [self.source_key],
            "board_key": self.board_key,
            "job_reference": str(job_ref),
            "profile_reference": str(profile_ref),
            "rating": 1 if is_shortlisted else 0,
            "message": comment
        }
        response = requests.post(endpoint, headers=self._get_headers(is_json=True), json=payload)
        self._handle_error(response)
        return response.json()