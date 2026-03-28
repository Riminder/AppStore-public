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

    def index_job(self, reference, raw_text: str):
        """
        Uses the Text Parsing API to extract structured job data (title, skills, sections)
        from raw text, then feeds it directly into the Job Indexing API.
        """
        # ---------------------------------------------------------
        # 1. TEXT PARSING (Extracting the structured job data)
        # ---------------------------------------------------------
        parse_endpoint = f"{self.base_url}/text/parsing"
        
        # We tell HrFlow to treat this text as a Job and format it accordingly
        parse_payload = {
            "texts": [str(raw_text)],
            "output_object": "job" 
        }
        
        parse_response = requests.post(parse_endpoint, headers=self._get_headers(is_json=True), json=parse_payload)
        self._handle_error(parse_response)
        
        # The AI returns a list of parsed objects; we grab the first one
        parsed_data = parse_response.json().get("data", [{}])[0]
        job_parsed = parsed_data.get("job", {})

        # Fallback to ensure the strict database validator doesn't crash if 
        # the AI somehow couldn't deduce a clear job title from the text.
        if not job_parsed.get("name"):
            job_parsed["name"] = "Untitled Parsed Job"
        job_parsed["reference"] = str(reference)

        # ---------------------------------------------------------
        # 2. JOB INDEXING (Saving it to the Board)
        # ---------------------------------------------------------
        index_endpoint = f"{self.base_url}/job/indexing"
        
        index_payload = {
            "board_key": self.board_key,
            "job": {
                **job_parsed
            }
        }
        
        index_response = requests.post(index_endpoint, headers=self._get_headers(is_json=True), json=index_payload)
        self._handle_error(index_response)
        
        logger.info(f"Successfully parsed and indexed Job: {reference}")
        return index_response.json()

    def parse_profile(self, reference, raw_text:str, file_path=None, source_url=""):
        """
        Hackathon Bypass: Since the free tier blocks synchronous AI Document Parsing,
        we use the Text Parsing API to extract structured data (skills, experiences),
        and then feed that directly into the instant Profile Indexing API!
        """
        if not raw_text and file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    profile_data = f.read()
            except:
                raw_text = "See attached file."
        
        # ---------------------------------------------------------
        # 1. TEXT PARSING (Extracting the structured data)
        # ---------------------------------------------------------
        parse_endpoint = f"{self.base_url}/text/parsing"
        
        # We tell HrFlow to treat this text as a Profile and format it accordingly
        parse_payload = {
            "texts": [str(raw_text)],
            "output_object": "profile" 
        }
        
        parse_response = requests.post(parse_endpoint, headers=self._get_headers(is_json=True), json=parse_payload)
        self._handle_error(parse_response)
        
        # The AI returns a list of parsed objects (one for each text we sent)
        parsed_data = parse_response.json().get("data", [{}])[0]

        # ---------------------------------------------------------
        # 2. PROFILE INDEXING (Saving it to the database)
        # ---------------------------------------------------------
        index_endpoint = f"{self.base_url}/profile/indexing"
        
        index_payload = {
            "source_key": self.source_key,
            "profile": {
                "reference": str(reference),
                **parsed_data["profile"]
            }
        }
        
        index_response = requests.post(index_endpoint, headers=self._get_headers(is_json=True), json=index_payload)
        self._handle_error(index_response)
        
        logger.info(f"Successfully parsed and instantly indexed Profile: {reference}")
        return index_response.json()

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
        endpoint = f"{self.base_url}/profiles/grading"
        params = {
            'algorithm_key': "grader-hrflow-jobs",
            'source_key': self.source_key,
            'board_key': self.board_key,
            'job_reference': str(job_reference)
        }
        
        if self.algorithm_key:
            params['algorithm_key'] = self.algorithm_key
            
        response = requests.get(endpoint, headers=self._get_headers(is_json=True), params=params)
        self._handle_error(response)
        
        raw_data = response.json()
        print(f"\n🔍 DEBUG API PAYLOAD: {json.dumps(raw_data)[:300]}...\n")
        
        data = raw_data.get('data', [])
        
        # Flatten HrFlow's nested dictionary structures into a standard list
        if isinstance(data, dict):
            # Check for standard wrapper keys
            for wrapper_key in ['predictions', 'profiles', 'matches']:
                if wrapper_key in data and isinstance(data[wrapper_key], list):
                    data = data[wrapper_key]
                    break
                    
        # If it's a nested list of lists (common in their ML endpoints), grab the first array
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            data = data[0]
            
        # If it is STILL a dictionary, wrap it in a list so scores[0] doesn't throw KeyError: 0
        if isinstance(data, dict):
            data = [data]
            
        return data

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
    
