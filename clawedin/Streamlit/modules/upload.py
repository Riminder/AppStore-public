import streamlit as st
from core.api import FASTAPI_URL
import requests

def render():
    st.header("Step 1: Upload Your CV")
    st.write("Upload your resume. AI will extract your skills and suggest search keywords.")

    uploaded_file = st.file_uploader("Drop your PDF here", type=["pdf"])

    if uploaded_file:
        st.success(f"✅ {uploaded_file.name} received")

        if st.button("🔍 Parse CV", use_container_width=True, type="primary"):
            with st.spinner("Parsing CV with HrFlow AI..."):
                try:
                    resp = requests.post(
                        f"{FASTAPI_URL}/parse-cv",
                        files={"file": (uploaded_file.name, uploaded_file.getvalue(), "application/pdf")},
                        timeout=60
                    )
                    parsed = resp.json()
                except Exception as e:
                    st.error(f"Parse failed: {e}")
                    return

            if parsed.get("code") == 400 or parsed.get("error"):
                st.error(f"HrFlow error: {parsed}")
                return

            # Store in session
            skills = parsed.get("skills", [])

            # Ask OpenClaw to generate job roles from skills
            job_roles = []
            try:
                import json
                skills_str = ", ".join(skills[:30])
                message = f"""/no_think
A candidate has these skills: {skills_str}
Suggest 10 specific job titles they should apply for.
Return ONLY a JSON array of 10 strings. JSON only.
"""
                resp = requests.post(
                    "http://localhost:18789/v1/chat/completions",
                    headers={
                        "Authorization": "Bearer ea28e9b03545f00a79e3d3c857e18fb0df7e83dc8f211b75",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "openclaw/default",
                        "messages": [{"role": "user", "content": message}]
                    },
                    timeout=30
                )
                raw = resp.json()["choices"][0]["message"]["content"]
                if "<think>" in raw:
                    raw = raw.split("</think>")[-1].strip()
                raw = raw.strip()
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                job_roles = json.loads(raw.strip())
                if not isinstance(job_roles, list):
                    job_roles = []
            except Exception as e:
                print(f"Role generation failed: {e}")
                job_roles = []

            st.session_state.uploaded_file = {
                "bytes": uploaded_file.getvalue(),
                "name":  uploaded_file.name
            }
            st.session_state.parsed_cv = {
                "name":    parsed.get("name", "Candidate"),
                "skills":  skills,
                "summary": parsed.get("summary", "")
            }
            st.session_state.profile_key = parsed.get("profile_key", "")
            st.session_state.job_roles   = job_roles
            st.session_state.step = "keywords"
            st.rerun()
