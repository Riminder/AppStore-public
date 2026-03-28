import json
import argparse
import sys
import shutil

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

INPUT = "/Users/hackathon-team9/.openclaw/workspace/initial_job_input.json"
OUTPUT = "/Users/hackathon-team9/.openclaw/workspace/full_job_context.json"

def main():
    kwd = []
    skills = []
    locations = []
    companies = []
    interest = []

    formated_json = {
        "role_keywords": kwd,
        "skills": skills,
        "locations": locations,
        "companies": companies,
        "domains_of_interest": interest,
        "max_results": 40
    }

        

if __name__ == "__main__":
    main()
