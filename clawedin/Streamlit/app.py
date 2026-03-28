import streamlit as st
from core.styles import apply_design_system
from core.session import init_session
from modules import auth, upload, engine, dashboard
from modules import keywords as keywords_module
from datetime import datetime

st.set_page_config(
    page_title="ClawedIn",
    page_icon="🦞",
    layout="wide",
    initial_sidebar_state="expanded"
)
apply_design_system()
init_session()

# Sidebar
with st.sidebar:
    st.markdown("""
        <div style="text-align:center;padding:16px 0 8px">
            <div style="font-size:40px">🤖</div>
            <div style="font-size:20px;font-weight:700;color:#f1f5f9">ClawedIn</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">Powered by OpenClaw + HrFlow</div>
        </div>
    """, unsafe_allow_html=True)

    st.divider()

    if st.session_state.logged_in:
        name = st.session_state.user_data.get("email", "Candidate")
        st.markdown(f"""
            <div style="padding:8px 0">
                <div style="color:#94a3b8;font-size:12px">Logged in as</div>
                <div style="color:#e2e8f0;font-size:14px;font-weight:500">{name}</div>
                <div style="color:#64748b;font-size:12px;margin-top:4px">{datetime.now().strftime('%d %b %Y')}</div>
            </div>
        """, unsafe_allow_html=True)

        st.divider()

        # Progress tracker
        step = st.session_state.step
        steps = ["upload", "keywords", "processing", "results"]
        step_names = ["Upload CV", "Review Profile", "AI Search", "Results"]
        current = steps.index(step) if step in steps else 0

        st.markdown("<div style='color:#64748b;font-size:12px;margin-bottom:8px'>PROGRESS</div>", unsafe_allow_html=True)
        for i, (s, n) in enumerate(zip(steps, step_names)):
            if i < current:
                icon = "✅"
                color = "#16a34a"
            elif i == current:
                icon = "▶️"
                color = "#2563eb"
            else:
                icon = "○"
                color = "#475569"
            st.markdown(f"<div style='color:{color};font-size:13px;padding:3px 0'>{icon} {n}</div>", unsafe_allow_html=True)

        st.divider()

        if st.button("🔄 New Search", use_container_width=True):
            st.session_state.step          = "upload"
            st.session_state.results       = []
            st.session_state.parsed_cv     = None
            st.session_state.uploaded_file = None
            st.session_state.job_roles     = []
            st.rerun()

        if st.button("Logout", use_container_width=True):
            st.session_state.logged_in = False
            st.session_state.step      = "upload"
            st.rerun()
    else:
        st.markdown("<div style='color:#64748b;font-size:13px'>Log in to activate your AI agent.</div>", unsafe_allow_html=True)

# Router
if not st.session_state.logged_in:
    auth.render()
else:
    step = st.session_state.step
    if step == "upload":
        upload.render()
    elif step == "keywords":
        keywords_module.render()
    elif step == "processing":
        engine.render()
    elif step == "results":
        dashboard.render()
