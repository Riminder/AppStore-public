import streamlit as st
import re

def clean_title(title: str) -> str:
    title = re.sub(r'^\d+[-—–]\s*', '', title)
    title = re.sub(r'\([^)]*\)', '', title)
    title = re.sub(r'\b(20\d{2})\b', '', title)
    title = re.sub(r'\b(NOW HIRING|URGENT|HIRING|APPLY NOW)\b', '', title, flags=re.IGNORECASE)
    return " ".join(title.split()).strip()

def render():
    parsed  = st.session_state.get("parsed_cv", {})
    results = st.session_state.get("results", [])

    # Progress indicator
    st.markdown("""
    <div class="step-indicator">
        <div class="step-dot done">✓</div>
        <div class="step-line done"></div>
        <div class="step-dot done">✓</div>
        <div class="step-line done"></div>
        <div class="step-dot done">✓</div>
        <div class="step-line done"></div>
        <div class="step-dot active">4</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown(f"## 🎯 {len(results)} Job Matches Found")
    st.caption(f"Ranked by OpenClaw AI for **{parsed.get('name','Candidate')}**")
    st.divider()

    for i, job in enumerate(results):
        score   = job.get("score", 0)
        title   = clean_title(job.get("title", "N/A"))
        company = job.get("company", "N/A")
        loc     = job.get("loc", "N/A")
        reason  = job.get("reason", "")
        url     = job.get("url", "")

        # Color based on score
        if score >= 80:
            badge_color = "#16a34a"
        elif score >= 60:
            badge_color = "#2563eb"
        else:
            badge_color = "#64748b"

        with st.container(border=True):
            col1, col2 = st.columns([0.82, 0.18])

            with col1:
                st.markdown(
                    "<span style='background:#1e3a5f;color:#7dd3fc;padding:2px 8px;"
                    "border-radius:12px;font-size:11px;font-weight:600;"
                    "letter-spacing:0.5px'>OPENCLAW</span>",
                    unsafe_allow_html=True
                )
                st.markdown(f"### {title}")
                st.caption(f"🏢 {company}  •  📍 {loc}")

                if reason and reason not in ["Relevant to your profile", "N/A", ""]:
                    st.markdown(
                        f"<div style='background:#1e2d40;border-left:3px solid #2563eb;"
                        f"border-radius:0 8px 8px 0;padding:8px 12px;margin:6px 0;"
                        f"font-size:13px;color:#93c5fd'>💡 {reason}</div>",
                        unsafe_allow_html=True
                    )

            with col2:
                st.markdown(
                    f"<div style='text-align:center;background:{badge_color};color:white;"
                    f"border-radius:12px;padding:14px 8px;'>"
                    f"<div style='font-size:24px;font-weight:700'>{score}%</div>"
                    f"<div style='font-size:10px;letter-spacing:1px;opacity:0.8'>MATCH</div>"
                    f"</div>",
                    unsafe_allow_html=True
                )

            if url and url not in ["N/A", "", "None"]:
                st.link_button(f"🔗 Apply Now → {company}", url)

        st.divider()

    col1, col2 = st.columns(2)
    with col1:
        if st.button("🔄 Search Again", use_container_width=True):
            st.session_state.step      = "keywords"
            st.session_state.results   = []
            st.session_state.job_roles = []
            st.rerun()
    with col2:
        if st.button("📄 New CV Upload", use_container_width=True):
            st.session_state.step          = "upload"
            st.session_state.results       = []
            st.session_state.parsed_cv     = None
            st.session_state.uploaded_file = None
            st.session_state.job_roles     = []
            st.rerun()
