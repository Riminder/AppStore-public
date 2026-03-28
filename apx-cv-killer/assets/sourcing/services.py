import requests
import logging
from django.conf import settings
from .models import CandidateProfile, CandidateScore, SearchSession

logger = logging.getLogger(__name__)


class OpenclawService:
    """Service to handle Openclaw API calls for web scraping"""

    def __init__(self):
        self.api_key = settings.OPENCLAW_API_KEY
        self.base_url = settings.OPENCLAW_BASE_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

    def search_profiles(self, query, search_session):
        """
        Search for candidate profiles across web sources using Openclaw

        Args:
            query (str): Search query based on job offer
            search_session (SearchSession): The search session to associate results with

        Returns:
            list: List of candidate profiles found
        """
        try:
            # TODO: Implement actual Openclaw API call
            # This is a placeholder for the integration
            endpoint = f"{self.base_url}/search"
            payload = {
                'query': query,
                'sources': ['linkedin', 'github', 'portfolios', 'cv_databases'],
                'limit': settings.MAX_RESULTS,
            }

            response = requests.post(endpoint, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()

            results = response.json().get('results', [])
            logger.info(f"Openclaw search returned {len(results)} results for query: {query}")

            return results

        except requests.exceptions.RequestException as e:
            error_msg = f"Openclaw API error: {str(e)}"
            logger.error(error_msg)
            search_session.status = 'failed'
            search_session.error_message = error_msg
            search_session.save()
            raise


class HrFlowService:
    """Service to handle HrFlow.ai API calls for parsing and scoring candidates"""

    def __init__(self):
        self.api_key = settings.HRFLOW_API_KEY
        self.source_key = settings.HRFLOW_SOURCE_KEY
        self.base_url = settings.HRFLOW_BASE_URL
        self.headers = {
            'X-API-KEY': self.api_key,
            'Content-Type': 'application/json',
        }

    def parse_profile(self, profile_data):
        """
        Parse a candidate profile using HrFlow API

        Args:
            profile_data (dict): Raw profile data from Openclaw

        Returns:
            dict: Parsed profile data with standardized fields
        """
        try:
            # TODO: Implement HrFlow profile parsing API call
            endpoint = f"{self.base_url}/profiles/parsing"
            payload = {
                'source_key': self.source_key,
                'data': profile_data,
            }

            response = requests.post(endpoint, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()

            parsed_data = response.json()
            logger.info(f"HrFlow parsed profile successfully")

            return parsed_data

        except requests.exceptions.RequestException as e:
            logger.error(f"HrFlow parsing error: {str(e)}")
            raise

    def score_candidate(self, job_description, candidate_profile):
        """
        Score a candidate against job requirements using HrFlow API

        Args:
            job_description (str): Job description/requirements
            candidate_profile (dict): Parsed candidate profile

        Returns:
            dict: Scoring results with match percentage and details
        """
        try:
            # TODO: Implement HrFlow scoring API call
            endpoint = f"{self.base_url}/profiles/scoring"
            payload = {
                'source_key': self.source_key,
                'job_description': job_description,
                'candidate': candidate_profile,
            }

            response = requests.post(endpoint, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()

            score_data = response.json()
            logger.info(f"HrFlow scored candidate")

            return score_data

        except requests.exceptions.RequestException as e:
            logger.error(f"HrFlow scoring error: {str(e)}")
            raise

    def search_profiles(self, query):
        """
        Search existing profiles in HrFlow using a query

        Args:
            query (str): Search query

        Returns:
            list: Matching profiles from HrFlow
        """
        try:
            endpoint = f"{self.base_url}/profiles/searching"
            payload = {
                'source_key': self.source_key,
                'name': query,
            }

            response = requests.get(endpoint, params=payload, headers=self.headers, timeout=30)
            response.raise_for_status()

            profiles = response.json().get('data', {}).get('profiles', [])
            logger.info(f"HrFlow search returned {len(profiles)} profiles")

            return profiles

        except requests.exceptions.RequestException as e:
            logger.error(f"HrFlow search error: {str(e)}")
            raise


class SourcingService:
    """Main service orchestrating the sourcing workflow"""

    def __init__(self):
        self.openclaw = OpenclawService()
        self.hrflow = HrFlowService()

    def process_job_offer(self, job_offer, search_session):
        """
        Main workflow: search, parse, score and rank candidates

        Args:
            job_offer (JobOffer): The job offer object
            search_session (SearchSession): The search session to track
        """
        try:
            # Step 1: Extract search query from job offer
            search_query = self._extract_search_query(job_offer)
            search_session.search_query = search_query
            search_session.status = 'running'
            search_session.save()

            # Step 2: Search using Openclaw
            openclaw_results = self.openclaw.search_profiles(search_query, search_session)
            search_session.openclaw_results_count = len(openclaw_results)
            search_session.save()

            # Step 3: Process each result - parse and score
            for result in openclaw_results[:settings.MAX_RESULTS]:
                self._process_candidate(result, job_offer.description, search_session)

            # Step 4: Mark session as completed
            search_session.status = 'completed'
            search_session.save()

            logger.info(f"Successfully processed {len(openclaw_results)} candidates for job {job_offer.id}")

        except Exception as e:
            logger.error(f"Error processing job offer: {str(e)}")
            search_session.status = 'failed'
            search_session.error_message = str(e)
            search_session.save()
            raise

    def _extract_search_query(self, job_offer):
        """
        Extract a search query from job offer description
        In a real implementation, use NLP/summarization

        Args:
            job_offer (JobOffer): The job offer

        Returns:
            str: Search query string
        """
        # TODO: Implement smart query extraction using NLP
        # For now, return first 50 chars of title
        return job_offer.title

    def _process_candidate(self, candidate_data, job_description, search_session):
        """
        Process a single candidate: create profile, parse, score

        Args:
            candidate_data (dict): Raw data from Openclaw
            job_description (str): Job description for scoring
            search_session (SearchSession): The search session
        """
        try:
            # Create candidate profile
            candidate = CandidateProfile.objects.create(
                search_session=search_session,
                source_url=candidate_data.get('url', ''),
                source_name=candidate_data.get('source', 'Unknown'),
                candidate_name=candidate_data.get('name', 'Unknown'),
                raw_data=candidate_data,
            )

            # Parse using HrFlow
            parsed_profile = self.hrflow.parse_profile(candidate_data)

            # Score using HrFlow
            score_data = self.hrflow.score_candidate(job_description, parsed_profile)

            # Create score record
            CandidateScore.objects.create(
                candidate=candidate,
                hrflow_score=score_data.get('score', 0),
                match_percentage=score_data.get('match_percentage', 0),
                skills_match=score_data.get('skills', {}),
                experience_match=score_data.get('experience', {}),
            )

            logger.info(f"Successfully processed candidate {candidate.candidate_name}")

        except Exception as e:
            logger.error(f"Error processing candidate: {str(e)}")
