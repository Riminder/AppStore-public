import streamlit as st
from pathlib import Path

def render():
    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown("<div style='padding-top:80px'>", unsafe_allow_html=True)
        st.title("Welcome to ClawedIn")
        st.write("Upload your CV and let our AI agent find the best jobs for you.")
        email    = st.text_input("Email Address", placeholder="alex@example.com")
        password = st.text_input("Password", type="password")
        if st.button("🚀 Launch Agent", type="primary", use_container_width=True):
            if email:
                st.session_state.logged_in = True
                st.session_state.user_data = {"email": email}
                st.session_state.step      = "upload"
                st.rerun()
            else:
                st.error("Please enter your email")
        st.markdown("</div>", unsafe_allow_html=True)

    with col2:
        logo_path = Path(__file__).parent.parent / "assets" / "log.svg"
        if logo_path.exists():
            svg_content = logo_path.read_text()
            st.markdown(
                f"""<div style='
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    min-height:500px;
                    padding-top:40px;
                '>
                <div style='width:90%;transform:scale(0.85);transform-origin:center center'>
                    {svg_content}
                </div></div>""",
                unsafe_allow_html=True
            )
