import streamlit as st

def init_session():
    defaults = {
        "logged_in":        False,
        "step":             "upload",
        "user_data":        {},
        "parsed_cv":        None,
        "uploaded_file":    None,
        "results":          [],
        "profile_key":      "",
        "search_keywords":  "",
        "search_location":  "Paris",
        "search_freshness": "pm"
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val
