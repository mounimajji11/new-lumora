"""
Lumora AI — Advanced LLM Chatbot (Groq LPU Engine)
Tagline: Ask anything. Understand more.
Framework: Streamlit + Python 3 + Groq SDK
Theme: Obsidian (#111713) + Jade (#53D6A3) + Warm Ivory (#F3F1E8)
Features: Pretrained Groq LPU Models (openai/gpt-oss-20b), Multi-Language Code Studio,
          Epistemic Humility, Text Summarizer, and Conversation History.
"""

import os
import json
import time
import streamlit as st
from datetime import datetime

# Import modular backend engine
from chatbot_engine import LumoraEngine, DEFAULT_GROQ_MODEL, SUPPORTED_GROQ_MODELS


# ---------------------------------------------------------
# Page Configuration & Obsidian/Jade Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="Lumora AI — Ask anything. Understand more.",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Obsidian (#111713) + Jade (#53D6A3) + Warm Ivory (#F3F1E8)
st.markdown("""
<style>
    .stApp {
        background-color: #111713;
        color: #F3F1E8;
    }
    [data-testid="stSidebar"] {
        background-color: #0C120F;
        border-right: 1px solid #29382F;
    }
    .brand-title {
        color: #F3F1E8;
        font-weight: 800;
        letter-spacing: -0.02em;
    }
    .brand-tagline {
        color: #A0AEA4;
        font-size: 0.85rem;
    }
    .stChatMessage[data-testid="stChatMessage"] {
        background-color: #19221C;
        border: 1px solid #29382F;
        border-radius: 12px;
        color: #F3F1E8;
    }
    .stButton>button {
        background-color: #53D6A3;
        color: #14251B;
        font-weight: 600;
        border: none;
        border-radius: 8px;
    }
    .stButton>button:hover {
        background-color: #A6E8CC;
        color: #14251B;
    }
    pre code {
        background-color: #0A0F0C !important;
        border: 1px solid #29382F !important;
        border-radius: 6px;
    }
</style>
""", unsafe_allow_html=True)


# ---------------------------------------------------------
# Session State Initialization
# ---------------------------------------------------------
if "engine" not in st.session_state:
    st.session_state.engine = LumoraEngine(model_name=DEFAULT_GROQ_MODEL)

if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": (
                "👋 **Welcome to Lumora AI!**\n\n"
                "*Ask anything. Understand more.*\n\n"
                f"I am your general-purpose AI assistant powered by Groq's high-speed LPU inference engine (`{DEFAULT_GROQ_MODEL}`). "
                "I can illuminate complex concepts, write code across 20+ programming languages, summarize dense articles, "
                "and explain reasoning step by step with ultra-low latency.\n\n"
                "What would you like to explore today?"
            ),
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }
    ]

if "api_key_override" not in st.session_state:
    st.session_state.api_key_override = ""


# ---------------------------------------------------------
# Sidebar Controls
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### ✨ Lumora AI")
    st.caption("Ask anything. Understand more. • Groq LPU Engine")

    st.markdown("---")
    st.subheader("🔑 API Key Status")

    env_key = os.getenv("GROQ_API_KEY", "")
    has_env = bool(env_key and env_key.strip() not in ("", "your_groq_api_key_here"))

    if has_env:
        st.success("✅ `GROQ_API_KEY` active from server environment")
    else:
        st.warning("⚠️ No `GROQ_API_KEY` found. Enter manually below:")

    manual_key = st.text_input(
        "Groq API Key (Optional Override)",
        type="password",
        value=st.session_state.api_key_override,
        help="Get an API key from https://console.groq.com/keys"
    )
    if manual_key != st.session_state.api_key_override:
        st.session_state.api_key_override = manual_key
        st.session_state.engine.set_api_key(manual_key)
        st.rerun()

    st.markdown("---")
    st.subheader("⚡ Model & Inference")

    model_options = SUPPORTED_GROQ_MODELS
    current_model = st.session_state.engine.model_name
    default_idx = model_options.index(current_model) if current_model in model_options else 0

    model_choice = st.selectbox(
        "Groq Model",
        model_options,
        index=default_idx,
        help="Default production model is openai/gpt-oss-20b. Legacy models (llama-3.3-70b-versatile, llama-3.1-8b-instant) have been decommissioned."
    )
    if model_choice != st.session_state.engine.model_name:
        st.session_state.engine.model_name = model_choice

    explanation_level = st.selectbox(
        "Explanation Style",
        ["Standard", "Beginner", "ELI5", "Technical"],
        index=0,
    )

    temperature = st.slider(
        "Temperature (Factuality)",
        min_value=0.0,
        max_value=1.0,
        value=0.3,
        step=0.05,
        help="Lower values prioritize deterministic factual correctness."
    )

    st.markdown("---")
    st.subheader("⚡ Quick Prompts")
    quick_prompts = [
        "Explain photosynthesis in simple English.",
        "Write a Python prime checker up to sqrt(n).",
        "Write a Java string reversal with StringBuilder.",
        "Difference between LLM and traditional ML model?",
        "Who was the 89th President of the USA? (Trap Query)",
    ]
    for qp in quick_prompts:
        if st.button(f"✨ {qp[:30]}...", use_container_width=True, key=f"btn_{qp[:15]}"):
            st.session_state.pending_prompt = qp

    st.markdown("---")
    col_clear, col_export = st.columns(2)
    with col_clear:
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.messages = []
            st.rerun()
    with col_export:
        chat_export_json = json.dumps(st.session_state.messages, indent=2)
        st.download_button(
            "💾 Export",
            data=chat_export_json,
            file_name=f"lumora_chat_{datetime.now().strftime('%Y%m%d_%H%M')}.json",
            mime="application/json",
            use_container_width=True
        )


# ---------------------------------------------------------
# Main UI Layout
# ---------------------------------------------------------
header_col1, header_col2 = st.columns([3, 1])
with header_col1:
    st.markdown("<h1 class='brand-title'>✨ Lumora AI</h1>", unsafe_allow_html=True)
    st.markdown("<p class='brand-tagline'>Ask anything. Understand more. • Groq LPU Inference</p>", unsafe_allow_html=True)
with header_col2:
    st.markdown(f"""
    <div style="background: #19221C; border: 1px solid #29382F; border-radius: 8px; padding: 0.5rem; text-align: center;">
        <span style="font-size: 0.7rem; color: #A0AEA4;">ENGINE</span><br/>
        <strong style="color: #53D6A3;">Groq Cloud</strong><br/>
        <span style="font-size: 0.7rem; color: #53D6A3;">
            {model_choice}
        </span>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

tab_chat, tab_code, tab_summarize = st.tabs(["💬 General Chat", "💻 Multi-Language Code Studio", "📄 Text Summarizer"])

# TAB 1: Chat
with tab_chat:
    for msg in st.session_state.messages:
        role = msg["role"]
        with st.chat_message(role, avatar="🧑‍💻" if role == "user" else "✨"):
            st.markdown(msg["content"])

    user_input = None
    if "pending_prompt" in st.session_state:
        user_input = st.session_state.pop("pending_prompt")
    else:
        user_input = st.chat_input("Ask anything (science, programming, concepts, general knowledge)...")

    if user_input:
        st.session_state.messages.append({
            "role": "user",
            "content": user_input,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })
        with st.chat_message("user", avatar="🧑‍💻"):
            st.markdown(user_input)

        with st.chat_message("assistant", avatar="✨"):
            with st.spinner("Generating ultra-fast response via Groq LPU..."):
                start_time = time.time()
                history_payload = [
                    {"role": m["role"], "content": m["content"]}
                    for m in st.session_state.messages[:-1]
                    if m.get("content")
                ]

                result = st.session_state.engine.generate_response(
                    user_message=user_input,
                    conversation_history=history_payload,
                    explanation_level=explanation_level,
                    temperature=temperature,
                )
                elapsed = round(time.time() - start_time, 2)

            st.markdown(result["text"])
            st.caption(f"⚡ Generated in {elapsed}s via Groq • Model: `{result['model_used']}`")

            st.session_state.messages.append({
                "role": "assistant",
                "content": result["text"],
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })

# TAB 2: Multi-Language Code Studio
with tab_code:
    st.subheader("💻 Multi-Language Code Studio")
    st.caption("Generate, debug, convert, and inspect code across Python, Java, JavaScript, C++, Rust, Go, SQL, and more.")

    lang_choice = st.selectbox(
        "Select Language",
        ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "SQL", "Bash", "PowerShell"],
        index=0
    )

    code_task = st.text_area(
        "Task description or code snippet:",
        value="Write a Binary Search function that returns the index or -1, with Big-O time and space complexity analysis."
    )

    if st.button("🚀 Generate Code & Analysis", type="primary"):
        with st.spinner("Generating solution via Groq..."):
            res = st.session_state.engine.generate_code_solution(code_task, language=lang_choice)
            st.markdown(res["text"])

# TAB 3: Summarizer
with tab_summarize:
    st.subheader("📄 Text Summarizer")
    st.caption("Condense articles and papers into bullet takeaways preserving original facts.")

    passage = st.text_area(
        "Text to summarize:",
        height=150,
        value="Large Language Models (LLMs) are deep learning systems trained on vast textual corpora using autoregressive token prediction. Rather than training models from scratch, modern applications interface with pretrained foundation models via secure API gateways like Groq."
    )
    style = st.radio("Summary Style", ["bullets", "short", "detailed", "takeaways"], horizontal=True)

    if st.button("✨ Summarize Text", type="primary"):
        with st.spinner("Summarizing via Groq..."):
            res = st.session_state.engine.summarize_text(passage, mode=style)
            st.markdown("### Summary:")
            st.markdown(res["text"])
