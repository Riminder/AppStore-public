#!/usr/bin/env python
"""
Create a job in HrFlow - this generates the job key needed for the sourcing app
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Get credentials
HRFLOW_API_KEY = os.getenv('HRFLOW_API_KEY')
HRFLOW_BOARD_KEY = os.getenv('HRFLOW_BOARD_KEY')

if not HRFLOW_API_KEY or not HRFLOW_BOARD_KEY:
    print("❌ Error: HRFLOW_API_KEY and HRFLOW_BOARD_KEY must be set in .env")
    exit(1)

headers = {
    "X-API-KEY": HRFLOW_API_KEY,
    "Content-Type": "application/json"
}

# Create a test job
job_payload = {
    "board_key": HRFLOW_BOARD_KEY,
    "name": "Senior Python Developer",
    "description": "We are looking for a Senior Python Developer with Django experience to join our team.",
    "location": "Remote",
    "recruiter_email": os.getenv('HRFLOW_USER_EMAIL', 'your-email@example.com'),
}

print("🚀 Creating job in HrFlow board...")
print(f"Board Key: {HRFLOW_BOARD_KEY}")

try:
    response = requests.post(
        "https://api.hrflow.ai/v1/jobs/add",
        json=job_payload,
        headers=headers,
        timeout=10
    )

    if response.status_code == 201 or response.status_code == 200:
        data = response.json()
        if data.get('code') == 201 or data.get('data'):
            job_key = data.get('data', {}).get('key')
            job_id = data.get('data', {}).get('id')

            print("✅ Job created successfully!")
            print(f"\n📋 Job Details:")
            print(f"   Job ID: {job_id}")
            print(f"   Job Key: {job_key}")
            print(f"\n📝 Add to your .env:")
            print(f"   HRFLOW_JOB_KEY={job_key}")

        else:
            print(f"⚠️ Response: {data}")
    else:
        print(f"❌ Error ({response.status_code}): {response.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
