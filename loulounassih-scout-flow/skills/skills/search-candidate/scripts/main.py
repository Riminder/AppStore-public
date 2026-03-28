import json
import argparse
import sys
import shutil
from dotenv import load_dotenv

import backend.scripts.run_discovery_pipeline as discover
import backend.scripts.run_scraping_pipeline as scrap
from backend.ranking.cv import CVManager
import logging, os

import backend.ranking.scoring as score

# Forme du input.json
"""
{
    "role_keywords": ["machine learning engineer", "ai engineer"],
    "skills": ["python", "fastapi", "llm", "rag"],
    "locations": ["berlin", "remote"],
    "companies": [],
    "domains_of_interest": ["github.com"],
    "max_results": 40
}
"""

def extract_persons():
    return

INPUT = "/Users/hackathon-team9/.openclaw/workspace/full_job_input.json"
OUTPUT = "/Users/hackathon-team9/.openclaw/workspace/candidate.json"
SUMMARY = "/Users/hackathon-team9/.openclaw/workspace/run_summary.txt"

SPLIT_DIR = "/Users/hackathon-team9/.openclaw/workspace/skills/search-candidate/scripts/backend/ranking/candidates_split"

logging.basicConfig(
    filename='/Users/hackathon-team9/.openclaw/workspace/skills/log.txt',          # Log file name
    level=logging.INFO,          # Minimum level: DEBUG, INFO, WARNING, ERROR, CRITICAL
    format='%(asctime)s - %(levelname)s - %(message)s',  # Timestamp, level, message
    filemode='a'                 # 'a' appends; 'w' overwrites
)

def main():
    if False:
        logging.info("Start MAIN")
        shutil.copy(INPUT, '/Users/hackathon-team9/.openclaw/workspace/skills/search-candidate/scripts/backend/data/discovery_input.json')
        discover.main()
        logging.info("Finish discovering")
        nb_cand = scrap.main()
        logging.info("Finish scrapping")
        shutil.copy('/Users/hackathon-team9/.openclaw/workspace/skills/search-candidate/scripts/backend/data/candidates.json', OUTPUT)

    # SCoring
    load_dotenv()
    SOURCE_KEY = os.getenv("SOURCE_KEY")
    API_KEY = os.getenv("API_KEY")
    API_USER = os.getenv("API_USER")

    #manager = CVManager(SOURCE_KEY, API_KEY, API_USER)
    #manager.archive_all_profiles()
    #manager.send_from_directory(SPLIT_DIR)

    score.main()



if __name__ == "__main__":
    main()
