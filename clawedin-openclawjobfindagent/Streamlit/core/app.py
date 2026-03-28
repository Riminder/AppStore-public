import streamlit as st
import time
import requests
import base64
from datetime import datetime

# --- CONFIGURATION & STYLING ---
st.set_page_config(
    page_title="AgentJob.ai | AI Career Scout",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for a high-end AI dashboard feel
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .main { background-color: #f8fafc; }
    
    /* Custom Card Styling */
    .job-card { 
        background-color: white; 
        padding: 24px; 
        border-radius: 16px; 
        border: 1px solid #e2e8f0; 
        margin-bottom: 16px;
        transition: all 0.3s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .job-card:hover {
        border-color: #3b82f6;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }
    
    .match-badge {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        text-align: center;
    }
    
    .match-score { font-size: 28px; font-weight: 800; line-height: 1; }
    .match-label { font-size: 10px; font-weight: 600; text-transform: uppercase; opacity: 0.9; }
    
    .source-tag {
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        text-transform: uppercase;
        margin-bottom: 8px;
        display: inline-block;
    }
    
    .tag-linkedin { background-color: #e0f2fe; color: #0369a1; }
    .tag-glassdoor { background-color: #dcfce7; color: #15803d; }
    .tag-jungle { background-color: #fef3c7; color: #b45309; }
    
    /* Button Styling */
    .stButton>button {
        border-radius: 12px;
        font-weight: 600;
        transition: all 0.2s;
    }
    </style>
    """, unsafe_allow_html=True)

# --- BACKEND INTEGRATION HELPERS ---
API_BASE = "http://localhost:8000" # Your FastAPI URL

def call_backend_api(endpoint, method="GET", data=None, files=None):
    """Generic helper to talk to FastAPI with error handling."""
    try:
        if method == "POST":
            if files:
                response = requests.post(f"{API_BASE}{endpoint}", files=files)
            else:
                response = requests.post(f"{API_BASE}{endpoint}", json=data)
        else:
            response = requests.get(f"{API_BASE}{endpoint}", params=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Backend Error: {response.status_code}")
            return None
    except Exception as e:
        # In a real app, don't show raw exception to user, but good for dev
        return None

# --- SESSION STATE MANAGEMENT ---
def init_session():
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False
    if "step" not in st.session_state:
        st.session_state.step = "welcome"
    if "user_data" not in st.session_state:
        st.session_state.user_data = {}
    if "parsed_cv" not in st.session_state:
        st.session_state.parsed_cv = None
    if "results" not in st.session_state:
        st.session_state.results = []

# --- UI COMPONENTS ---

def sidebar_navigation():
    with st.sidebar:
        st.image("https://cdn-icons-png.flaticon.com/512/2103/2103811.png", width=80)
        st.title("AgentJob.ai")
        st.markdown("---")
        
        if st.session_state.logged_in:
            st.write(f"👤 **User:** {st.session_state.user_data.get('email', 'Candidate')}")
            st.write(f"📅 **Session:** {datetime.now().strftime('%Y-%m-%d')}")
            
            if st.button("🔄 New Search"):
                st.session_state.step = "upload"
                st.rerun()
                
            if st.button("🚪 Logout"):
                st.session_state.logged_in = False
                st.session_state.step = "welcome"
                st.rerun()
        else:
            st.info("Log in to activate your AI agent.")

def login_screen():
    col1, col2 = st.columns([1, 1])
    with col1:
        st.title("Access your AI Agent")
        st.write("Log in to securely upload your CV and begin your automated search.")
        email = st.text_input("Email Address", placeholder="alex@example.com")
        password = st.text_input("Password", type="password")
        if st.button("Launch Agent", use_container_width=True):
            # Simulation of FastAPI Auth
            st.session_state.logged_in = True
            st.session_state.user_data = {"email": email}
            st.session_state.step = "upload"
            st.rerun()
    with col2:
        st.image("https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000", use_container_width=True)

def upload_screen():
    st.header("Step 1: Profile Initialization")
    st.write("Upload your resume. Our **Quen-based NLP** will extract your core competencies.")
    
    uploaded_file = st.file_uploader("Drop your PDF or DOCX here", type=['pdf', 'docx'])
    
    if uploaded_file:
        st.success("File received. Ready to parse.")
        if st.button("Start AI Pipeline", use_container_width=True):
            st.session_state.step = "processing"
            st.rerun()

def processing_screen():
    st.header("Step 2: AI Execution Pipeline")
    
    # 1. Quen Parsing
    with st.status("🧠 **Quen AI:** Parsing CV Structure...", expanded=True) as status:
        st.write("Extracting technical stack...")
        time.sleep(1.2)
        st.write("Identifying seniority level: *Senior Full Stack* detected.")
        time.sleep(1.0)
        st.write("Mapping location preferences: *Europe/Remote*.")
        st.session_state.parsed_cv = {"skills": ["Python", "React", "FastAPI"], "level": "Senior"}
        status.update(label="✅ CV Parsing Complete", state="complete", expanded=False)

    # 2. Live Web Scraper Agent
    st.subheader("🌐 Active Web Searching")
    cols = st.columns(3)
    sources = [
        {"name": "LinkedIn", "icon": "🔵", "count": 18},
        {"name": "Glassdoor", "icon": "🟢", "count": 12},
        {"name": "Welcome to the Jungle", "icon": "🟡", "count": 9}
    ]
    
    for i, source in enumerate(sources):
        with cols[i]:
            with st.container(border=True):
                st.write(f"{source['icon']} **{source['name']}**")
                progress_bar = st.progress(0)
                for percent in range(101):
                    time.sleep(0.01)
                    progress_bar.progress(percent)
                st.caption(f"Scanned {source['count']} relevant openings")

    # 3. HR Flow Ranking
    with st.status("⚖️ **HR Flow:** Ranking Match Relevance...") as status:
        st.write("Running semantic similarity algorithm...")
        time.sleep(1.5)
        st.write("Calculating match scores for 39 jobs...")
        status.update(label="🎯 Pipeline Execution Complete!", state="complete")
        
    if st.button("Review My Ranked Matches", type="primary", use_container_width=True):
        # Mock Results from HR Flow
        st.session_state.results = [
            {"title": "Senior AI Software Engineer", "company": "NeuralPath", "score": 98, "loc": "Remote", "source": "LinkedIn", "salary": "€80k - €110k"},
            {"title": "Full Stack Architect", "company": "GrowthOps", "score": 94, "loc": "Paris / Hybrid", "source": "Welcome to the Jungle", "salary": "€75k - €95k"},
            {"title": "Engineering Manager (AI)", "company": "Vortex Labs", "score": 87, "loc": "London / Remote", "source": "Glassdoor", "salary": "£90k - £120k"},
            {"title": "Lead Python Developer", "company": "EcoTech", "score": 82, "loc": "Berlin", "source": "LinkedIn", "salary": "€70k - €85k"},
        ]
        st.session_state.step = "results"
        st.rerun()

def results_screen():
    st.header("Step 3: Intelligence Insights")
    st.write(f"We found **{len(st.session_state.results)}** high-probability matches for your profile.")
    
    # Filter/Sort UI
    col_f1, col_f2, _ = st.columns([1, 1, 2])
    with col_f1:
        st.selectbox("Sort by", ["Match Score (High-Low)", "Newest", "Salary"])
    with col_f2:
        st.multiselect("Source Filter", ["LinkedIn", "Glassdoor", "Welcome to the Jungle"])

    st.divider()

    # Job Cards
    for job in st.session_state.results:
        source_class = "tag-linkedin" if job['source'] == "LinkedIn" else "tag-jungle" if job['source'] == "Welcome to the Jungle" else "tag-glassdoor"
        
        st.markdown(f"""
        <div class="job-card">
            <div style="flex: 1;">
                <span class="source-tag {source_class}">{job['source']}</span>
                <h3 style="margin: 0; font-size: 20px; color: #1e293b;">{job['title']}</h3>
                <p style="margin: 4px 0; color: #64748b; font-weight: 500;">{job['company']} • {job['loc']}</p>
                <p style="margin: 0; color: #2563eb; font-weight: 700; font-size: 14px;">{job['salary']}</p>
            </div>
            <div class="match-badge">
                <div class="match-score">{job['score']}%</div>
                <div class="match-label">Match Score</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("View Agent Analysis"):
            st.write(f"**Why this match?** HR Flow API detected a high semantic overlap between your *{st.session_state.parsed_cv['skills'][0]}* experience and this role's requirements.")
            st.button(f"Apply on {job['source']}", key=job['title'])

# --- APP ROUTING ---
init_session()
sidebar_navigation()

if not st.session_state.logged_in:
    login_screen()
else:
    if st.session_state.step == "upload":
        upload_screen()
    elif st.session_state.step == "processing":
        processing_screen()
    elif st.session_state.step == "results":
        results_screen()