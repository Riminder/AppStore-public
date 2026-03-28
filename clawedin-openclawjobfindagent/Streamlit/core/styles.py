import streamlit as st

def apply_design_system():
    st.markdown("""
    <style>
    /* ── Global ── */
    .stApp { background-color: #0f1117; }

    /* ── Fix red/orange primary buttons → blue ── */
    .stButton > button[kind="primary"] {
        background-color: #2563eb !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        padding: 0.6rem 1.2rem !important;
    }
    .stButton > button[kind="primary"]:hover {
        background-color: #1d4ed8 !important;
    }

    /* ── Secondary buttons → neutral dark ── */
    .stButton > button[kind="secondary"],
    .stButton > button:not([kind]) {
        background-color: #1e2130 !important;
        color: #e2e8f0 !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
    }
    .stButton > button[kind="secondary"]:hover,
    .stButton > button:not([kind]):hover {
        background-color: #2d3748 !important;
        border-color: #4a5568 !important;
    }

    /* ── Logout button — neutral gray ── */
    .stButton > button:has(div:contains("Logout")),
    .stButton > button:has(div:contains("🚪")) {
        background-color: #374151 !important;
        color: #9ca3af !important;
        border: 1px solid #4b5563 !important;
    }

    /* ── Sidebar ── */
    [data-testid="stSidebar"] {
        background-color: #111827 !important;
    }
    [data-testid="stSidebar"] .stButton > button {
        width: 100% !important;
        text-align: left !important;
    }

    /* ── Progress steps indicator ── */
    .step-indicator {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        align-items: center;
    }
    .step-dot {
        width: 32px; height: 32px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 600;
    }
    .step-dot.active  { background: #2563eb; color: white; }
    .step-dot.done    { background: #16a34a; color: white; }
    .step-dot.pending { background: #1e2130; color: #64748b; border: 1px solid #334155; }
    .step-line { flex: 1; height: 2px; background: #1e2130; }
    .step-line.done { background: #16a34a; }

    /* ── Job cards ── */
    .job-card {
        background: #1a1f2e;
        border: 1px solid #2d3748;
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;
        gap: 16px;
    }
    .job-card:hover { border-color: #2563eb; }
    .job-card h3 { margin: 0 0 4px 0; font-size: 17px; color: #f1f5f9; font-weight: 600; }
    .job-card .meta { color: #94a3b8; font-size: 13px; margin-bottom: 10px; }
    .match-badge {
        min-width: 72px; text-align: center;
        background: #2563eb; border-radius: 10px;
        padding: 10px 8px;
    }
    .match-badge .score { font-size: 22px; font-weight: 700; color: white; }
    .match-badge .label { font-size: 10px; color: #bfdbfe; letter-spacing: 1px; }
    .match-badge.high   { background: #16a34a; }
    .match-badge.medium { background: #2563eb; }
    .match-badge.low    { background: #64748b; }

    /* ── Skill chips ── */
    .skill-chip {
        display: inline-block;
        background: #1e3a5f;
        color: #7dd3fc;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        margin: 3px;
    }

    /* ── Source tag ── */
    .tag-openclaw {
        background: #1e3a5f; color: #7dd3fc;
        padding: 2px 8px; border-radius: 12px;
        font-size: 11px; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* ── Info box ── */
    .reason-box {
        background: #1e2d40;
        border-left: 3px solid #2563eb;
        border-radius: 0 8px 8px 0;
        padding: 8px 12px;
        margin: 8px 0;
        font-size: 13px;
        color: #93c5fd;
    }

    /* ── Hide streamlit branding ── */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    header { visibility: hidden; }

    /* ── Input fields ── */
    .stTextInput > div > div > input {
        background-color: #1e2130 !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
        color: #e2e8f0 !important;
    }
    </style>
    """, unsafe_allow_html=True)
