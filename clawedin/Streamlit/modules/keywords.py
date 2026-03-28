import streamlit as st

def render():
    parsed  = st.session_state.get("parsed_cv", {})
    name    = parsed.get("name", "Candidate")
    skills  = parsed.get("skills", [])
    summary = parsed.get("summary", "")

    st.header(f"Step 2: Review Your Profile")

    # Profile card
    with st.container(border=True):
        col1, col2 = st.columns([0.3, 0.7])
        with col1:
            st.markdown(f"**👤 {name}**")
        with col2:
            if summary:
                st.caption(summary[:200])

    st.divider()

    # All skills from HrFlow — show as chips
    st.subheader("🧠 Skills extracted by HrFlow AI")
    if skills:
        chips_html = " ".join([
            f"<span style='background:#1e3a5f;color:#7dd3fc;padding:4px 10px;"
            f"border-radius:20px;font-size:13px;display:inline-block;margin:3px'>{s}</span>"
            for s in skills
        ])
        st.markdown(chips_html, unsafe_allow_html=True)
    else:
        st.warning("No skills extracted — try a different CV format")

    st.divider()

    # Search keyword editor — use top skills directly from HrFlow
    st.subheader("🔎 Search keywords")
    st.caption("Generated from your parsed CV. Edit to refine.")

    # Use job roles if available, otherwise fall back to skills
    job_roles = st.session_state.get("job_roles", [])
    if job_roles:
        default_keywords = ", ".join(job_roles[:5])
    else:
        default_keywords = " ".join(skills[:5]) if skills else ""

    keywords = st.text_input(
        "Search keywords",
        value=default_keywords,
        placeholder="e.g. Python Data Engineer FastAPI",
        help="Edit these keywords to refine your job search"
    )

    location = st.text_input(
        "Location",
        value="Paris",
        placeholder="e.g. Paris, London, Remote"
    )

    st.divider()

    # Timeline filter
    st.subheader("📅 Job posting recency")
    freshness_map = {
        "24 hours": "pd",
        "1 week":   "pw",
        "1 month":  "pm",
        "Any time": "py"
    }
    selected = st.radio(
        "Recency",
        options=list(freshness_map.keys()),
        index=3,
        horizontal=True,
        label_visibility="collapsed"
    )

    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        if st.button("← Back", use_container_width=True):
            st.session_state.step = "upload"
            st.session_state.results = []
            st.rerun()
    with col2:
        if st.button("🚀 Start Searching", type="primary", use_container_width=True):
            if not keywords.strip():
                st.error("Please enter keywords")
                return
            st.session_state.search_keywords  = keywords
            st.session_state.search_location  = location
            st.session_state.search_freshness = freshness_map[selected]
            st.session_state.results = []
            st.session_state.step = "processing"
            st.rerun()
