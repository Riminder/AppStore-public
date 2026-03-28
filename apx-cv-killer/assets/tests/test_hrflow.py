import os
import django
import sys
import time
from pathlib import Path

# 1. Initialize Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cv_killer.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Failed to load Django settings: {e}")
    sys.exit(1)

# Import the refactored service
from sourcing.hrflow_service import HrFlowService 

def run_tests():
    print("🚀 Starting Refactored HrFlow Integration Tests...\n")
    
    try:
        service = HrFlowService()
        print("✅ Service initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to initialize service: {e}")
        return

    # --- TEST 1: Index a Job (User Input Simulation) ---
    job_ref = "test-job-http-007"
    print("\n📝 TEST 1: Indexing User-Created Job...")
    try:
        service.index_job(
            reference=job_ref,
            title="Senior Django Developer",
            description="Looking for an expert Python/Django developer for a hackathon project.",
            skills=["Python", "Django", "APIs"],
            location_text="Paris, France"
        )
        print("✅ Job indexed successfully!")
    except Exception as e:
        print(f"❌ Job indexing failed: {e}")

    # --- TEST 2: Parse a Profile (OpenClaw Simulation) ---
    profile_ref = "test-profile-http-007"
    print("\n👤 TEST 2: AI Parsing OpenClaw Scraped Profile...")
    try:
        raw_cv_text = """
        John Smith
        john.smith@example.com
        Location: Paris, France

        Experienced Backend Developer. 
        Skills: Python, Django, REST APIs, Docker.
        """
        service.parse_profile(
            reference=profile_ref, 
            raw_text=raw_cv_text,
            source_url="https://github.com/johnsmith"
        )
        print("✅ Profile text parsed and indexed successfully!")
    except Exception as e:
        print(f"❌ Profile text parsing failed: {e}")

    # --- TEST 3: Parse a PDF (Optional/Demo) ---
    # This will only run if you have a 'test_cv.pdf' in your root folder
    pdf_path = os.path.join(BASE_DIR, "test_cv.pdf")
    if os.path.exists(pdf_path):
        print("\n📄 TEST 3: AI Parsing a physical PDF file...")
        try:
            service.parse_profile(reference="pdf-test-001", file_path=pdf_path)
            print("✅ PDF parsed and indexed successfully!")
        except Exception as e:
            print(f"❌ PDF parsing failed: {e}")
    else:
        print("\nℹ️ Skipping PDF test (No 'test_cv.pdf' found in root).")


    print("\n⏳ Waiting 15 seconds for AI Vector Indexing to process the raw text...")
    time.sleep(15)
    # --- TEST 4: Scoring ---
    print("\n🎯 TEST 4: Requesting Match Scores...")
    try:
        scores = service.get_candidate_scores(job_reference=job_ref)
        if scores:
            print(f"✅ Found {len(scores)} matches. Top Score: {scores[0].get('score') * 100:.1f}%")
        else:
            print("⚠️ Scoring returned 0 results. (Try increasing wait time or check Dashboard).")
    except Exception as e:
        print(f"❌ Scoring failed: {e}")

    # --- TEST 5: Rating Signal ---
    print("\n👎 TEST 5: Sending Rejection Signal...")
    try:
        service.send_rating(
            job_ref=job_ref,
            profile_ref=profile_ref,
            is_shortlisted=False,
            comment="Refactored test rejection."
        )
        print("✅ Rating signal sent successfully!")
    except Exception as e:
        print(f"❌ Rating failed: {e}")

    print("\n🎉 Integration testing complete.")

if __name__ == "__main__":
    run_tests()