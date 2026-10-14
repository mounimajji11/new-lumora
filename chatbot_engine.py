"""
Lumora AI — Core Groq LLM Engine Module
Tagline: Ask anything. Understand more.
Description: Python backend engine interfacing with the official Groq SDK.
Maintains multi-turn context, epistemic humility constraints,
exponential backoff retry logic, and multi-language programming support.
"""

import os
import time
import random
from typing import Dict, List, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from groq import Groq
except ImportError:
    Groq = None

# Central configuration for Groq Models
DEFAULT_GROQ_MODEL = os.getenv("GROQ_DEFAULT_MODEL", "openai/gpt-oss-20b")
SUPPORTED_GROQ_MODELS = [
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b",
]
SUPPORTED_GROQ_MODELS_METADATA = [
    {
        "id": "openai/gpt-oss-20b",
        "name": "OpenAI GPT-OSS 20B (Default & Recommended)",
        "speed": "Ultra-Fast",
        "description": "20B MoE foundation model, 128k context window, optimized for ultra-low latency reasoning on Groq LPUs.",
    },
    {
        "id": "openai/gpt-oss-120b",
        "name": "OpenAI GPT-OSS 120B (High Capability MoE)",
        "speed": "Fast",
        "description": "120B MoE model, 128k context window, deep multi-step reasoning and complex coding.",
    },
    {
        "id": "qwen/qwen3.6-27b",
        "name": "Qwen 3.6 27B (Reasoning & Code)",
        "speed": "Ultra-Fast",
        "description": "27B reasoning model, official Groq migration target for math and code analysis.",
    },
    {
        "id": "qwen/qwen3.8-27b",
        "name": "Qwen 3.8 27B (Multimodal & Instruct)",
        "speed": "Ultra-Fast",
        "description": "131k context window, multimodal capabilities on Groq LPUs.",
    },
]
DEPRECATED_GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


SYSTEM_INSTRUCTION = """
You are Lumora AI, a helpful and accurate AI assistant. Understand the user's intent before answering. Answer the exact request first. Follow explicit instructions about format, number of items, language, and detail. If the user asks for a list, return a list. If the user asks for a single answer, return a single answer. If the user asks for an explanation, explain clearly. Do not turn simple vocabulary requests into long sentences or essays. Avoid unnecessary introductions and filler. Never fabricate information. If uncertain, say so clearly.

TASK-SPECIFIC RESPONSE FORMATTING:
1. Vocabulary:
- Synonyms: provide similar words directly as a list or concise format (e.g., Happy: joyful, cheerful, delighted, pleased, glad). If a count is requested (e.g., 5 synonyms), provide exactly that count as a numbered or bullet list.
- Antonyms: provide opposite words directly as a list (e.g., Happy: sad, unhappy, miserable, sorrowful). If a count is requested, provide exactly that count.
- Word meanings: provide a simple definition and one short example only when useful (e.g., Diligent: showing care and consistent effort in your work. Example: She was diligent in reviewing her notes).
- Fill-in-the-blanks: provide the correct word and a brief reason if requested.
- Grammar correction: show the corrected sentence and explain the correction only when useful.
- Strict brevity: do not output conversational filler (do NOT say 'Sure, here are...', 'Certainly!', 'I would be happy to help!').

2. Aptitude and Reasoning:
- Give the correct answer first directly (e.g., '32' or 'Answer: 32').
- Show the formula, pattern, and simple steps when the user asks for an explanation or steps.
- Do not replace a numerical answer with a generic paragraph.

3. Programming:
- Provide clean, working code when code is requested.
- Explain the logic in simple language when requested.
- Do not give unrelated theory instead of the requested code or output. Label code blocks with language identifiers.

4. Summarization:
- Summarize the provided content rather than discussing the topic generally.
- Respect the requested word count, bullet format, and style.

5. General Questions:
- Answer the actual question directly.
- Use headings or bullets only when they improve readability.
- Avoid unnecessary introductions, repeated conclusions, and unrelated information.
- If the user says 'Only give the answer', return strictly the answer without any extra text or explanation.
- If the user asks to 'Explain step by step', provide clear, ordered steps.

CORE PRINCIPLES OF LUMORA AI:
1. RIGOROUS TRUTHFULNESS & FACTUAL DISTINCTION:
   - State verified facts clearly.
   - Distinguish verified facts from estimates, hypotheses, or opinions.
   - If an assumption is made, state it explicitly.
2. HUMILITY & ADMITTING UNCERTAINTY:
   - If reliable evidence or conclusive answers do not exist, state: "I cannot confirm this with high certainty because..." rather than fabricating an answer.
   - Refuse false premises politely (e.g. if asked about a non-existent president or fictional entity).
   - NEVER invent citations, URLs, statistics, quotes, or software libraries.
3. PROGRAMMING & MULTI-LANGUAGE EXCELLENCE:
   - When asked to write code, support the requested programming language (Python, Java, JavaScript, TypeScript, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift, SQL, HTML, CSS, Bash, PowerShell).
   - Never confuse Java syntax with JavaScript syntax.
   - Separate executable code from explanations. Label every code block with its language identifier.
   - Clarify that code is generated and explained by the LLM, not executed directly unless an external runner is attached.
   - Estimate Big-O time and space complexity for algorithms when appropriate.
""".strip()


def get_response_style_instructions(preference: str = "Balanced", mode: str = "general") -> Dict[str, Any]:
    """
    Dedicated helper returning distinct operational directives and token limits
    for Concise, Balanced, and Detailed modes.
    """
    norm = (preference or "balanced").strip().lower()
    if norm == "concise":
        return {
            "style": "concise",
            "display_name": "Concise",
            "max_tokens": 700 if mode == "code" else 350,
            "directive": (
                "PRIMARY OPERATIONAL DIRECTIVE — RESPONSE STYLE: CONCISE (STRICT BREVITY).\n"
                "- The user has explicitly selected the CONCISE response preference.\n"
                "- Provide a direct, strictly brief answer in approximately 1 to 3 short sentences.\n"
                "- Answer the core question directly in the very first sentence.\n"
                "- Strictly avoid background history, multiple subsections, or lengthy elaboration unless specifically requested.\n"
                "- For code requests: provide the working code cleanly with minimal commentary."
            ),
        }
    if norm == "detailed":
        return {
            "style": "detailed",
            "display_name": "Detailed",
            "max_tokens": 3000 if mode == "code" else 2500,
            "directive": (
                "PRIMARY OPERATIONAL DIRECTIVE — RESPONSE STYLE: DETAILED (COMPREHENSIVE DEPTH).\n"
                "- The user has explicitly selected the DETAILED response preference. This explicitly OVERRIDES all default brevity or short-definition guidelines.\n"
                "- You MUST provide an expansive, in-depth, structured guide explaining the topic thoroughly across multiple sections.\n"
                "- Do NOT provide a short 1-sentence or 1-paragraph summary.\n"
                "- Structure your response using markdown headings (##, ###) and clear sections:\n"
                "  1. Overview & Core Definition (historical context, creator, design philosophy).\n"
                "  2. Core Architecture & Key Features (dynamic typing, syntax, standard library).\n"
                "  3. Real-World Applications & Use Cases (web, data science, automation, AI).\n"
                "  4. Practical Code or Concrete Demonstration (clean, working code example with explanation).\n"
                "  5. Strengths, Trade-offs & Best Practices (pros, cons, and performance considerations).\n"
                "- Include comprehensive detail, structured bullet points, and code blocks."
            ),
        }
    return {
        "style": "balanced",
        "display_name": "Balanced",
        "max_tokens": 1200 if mode == "code" else 900,
        "directive": (
            "PRIMARY OPERATIONAL DIRECTIVE — RESPONSE STYLE: BALANCED (MODERATE EXPLANATION).\n"
            "- The user has selected the BALANCED response preference.\n"
            "- Provide a clear, well-rounded explanation of moderate length (2 to 3 well-formed paragraphs or structured points).\n"
            "- Answer the question directly first, explain 3-4 key characteristics, and include a helpful concrete example.\n"
            "- Avoid single-sentence extreme brevity and avoid overwhelming encyclopedic detail."
        ),
    }


class LumoraEngine:
    """
    Core engine managing conversation state, Groq API calls,
    exponential backoff, and error recovery.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        """
        Initialize the Lumora engine with Groq API.
        Reads GROQ_API_KEY and GROQ_DEFAULT_MODEL from environment.
        """
        self.api_key = api_key if api_key is not None else os.getenv("GROQ_API_KEY", "")
        raw_model = model_name or os.getenv("GROQ_DEFAULT_MODEL", DEFAULT_GROQ_MODEL)
        # Migrate deprecated models automatically
        if raw_model in DEPRECATED_GROQ_MODELS or "llama" in raw_model:
            raw_model = DEFAULT_GROQ_MODEL
        self.model_name = raw_model
        self._client: Optional[Any] = None
        self._init_client()

    def _init_client(self) -> None:
        """Initialize or re-initialize the Groq client."""
        if not self.api_key or self.api_key.strip() in ("", "your_groq_api_key_here"):
            self._client = None
            return

        if Groq is None:
            self._client = None
            return

        try:
            self._client = Groq(api_key=self.api_key.strip())
        except Exception as e:
            self._client = None
            raise ValueError(f"Failed to initialize Groq Client: {str(e)}")

    def is_configured(self) -> bool:
        """Check if a valid API key is present."""
        if not self.api_key or self.api_key.strip() in ("", "your_groq_api_key_here"):
            return False
        return True

    def set_api_key(self, new_key: str) -> bool:
        """Update the active API key dynamically."""
        self.api_key = new_key
        try:
            self._init_client()
            return self.is_configured()
        except Exception:
            return False

    def generate_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        explanation_level: str = "Standard",
        temperature: float = 0.3,
        target_language: str = "Auto-Detect",
        response_style: str = "Balanced",
        mode: str = "general",
        response_language: str = "Auto-detect",
    ) -> Dict[str, Any]:
        """
        Generate a conversational response from Groq.

        Parameters:
        - user_message: The prompt or question asked by the user.
        - conversation_history: List of prior messages [{'role': 'user'|'assistant', 'content': '...'}]
        - explanation_level: 'Beginner', 'Standard', 'Technical', or 'ELI5'.
        - temperature: Sampling temperature (lower = more deterministic & factual).
        - target_language: Preferred programming language context.
        - response_style: 'Concise', 'Balanced', or 'Detailed'.
        - mode: 'general', 'code', or 'summarize'.
        - response_language: Target output language name (e.g. 'Spanish', 'French', etc.).

        Returns:
        - Dict with 'text', 'error', 'model_used', 'latency'.
        """
        if not self.is_configured():
            return {
                "text": (
                    "🔑 **Groq API Key Required**\n\n"
                    "Lumora AI requires a Groq API key to generate high-speed LPU responses.\n"
                    "Please set `GROQ_API_KEY` in your `.env` file or environment variables on the server.\n"
                    "You can obtain an API key at [console.groq.com/keys](https://console.groq.com/keys)."
                ),
                "error": "MISSING_API_KEY",
                "model_used": self.model_name,
            }

        level_instructions = {
            "Beginner": "Target audience: High school/undergraduate beginner. Use everyday real-life analogies, avoid overly dense jargon, and define acronyms.",
            "ELI5": "Target audience: Explain like I'm 5. Use simple metaphors, storytelling, and short digestible sections.",
            "Technical": "Target audience: Software engineer or researcher. Provide formal definitions, Big-O complexities, and exact terminology.",
            "Standard": "Target audience: General intelligent reader. Balance accessibility with factual precision.",
        }
        level_prompt = level_instructions.get(explanation_level, level_instructions["Standard"])

        # Response length preference adaptation via single source of truth helper
        style_config = get_response_style_instructions(response_style, mode=mode)
        max_tokens_val = style_config["max_tokens"]

        active_instruction = (
            f"{style_config['directive']}\n\n"
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"AUDIENCE ADAPTATION:\n{level_prompt}"
        )

        if mode == "code":
            lang = target_language if target_language and target_language != "Auto-Detect" else "the requested language"
            active_instruction += f"\n\nSPECIALIZED FOCUS: CODE ASSISTANT. Target Language: {lang}. Provide complete, robust, cleanly commented code, analyze edge cases, and explain logic clearly."
        elif mode == "summarize":
            active_instruction += "\n\nSPECIALIZED FOCUS: TEXT SUMMARIZER. Preserve the core meaning accurately. Provide structured bullet takeaways, key insights, and a concise executive conclusion without introducing external bias."

        if target_language and target_language != "Auto-Detect" and mode != "code":
            active_instruction += f"\n\nPROGRAMMING LANGUAGE CONTEXT: The user is specifically focusing on {target_language}. Ensure all code examples are strictly idiomatic in {target_language}."

        if response_language and response_language not in ("Auto-detect", "Auto-Detect"):
            active_instruction += f"\n\nRESPONSE LANGUAGE: The user requested responses in {response_language}. Please reply accurately in {response_language}."

        # Format messages array for Groq chat completions
        # System instructions are preserved with every request
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": active_instruction}
        ]

        if conversation_history:
            for msg in conversation_history:
                # Never allow history to overwrite or displace the system instruction
                if msg.get("role") == "system":
                    continue
                # Skip default introductory welcome message from history
                content_text = (msg.get("content") or "").strip()
                if not content_text:
                    continue
                if msg.get("id") == "init-msg" or (
                    msg.get("role") == "assistant"
                    and ("Welcome to Lumora AI" in content_text or "Hello, I am **Lumora AI**" in content_text)
                ):
                    continue

                role = "user" if msg.get("role") == "user" else "assistant"
                # Avoid duplicate consecutive identical messages
                if messages and messages[-1].get("role") == role and messages[-1].get("content", "").strip() == content_text:
                    continue

                messages.append({"role": role, "content": content_text})

        # Do not send the same user message twice if caller already included it in history
        cleaned_user_msg = (user_message or "").strip()
        if cleaned_user_msg:
            if not (messages and messages[-1].get("role") == "user" and messages[-1].get("content", "").strip() == cleaned_user_msg):
                messages.append({"role": "user", "content": cleaned_user_msg})

        safe_temp = max(0.0, min(1.0, float(temperature)))
        active_model = self.model_name or DEFAULT_GROQ_MODEL
        if active_model in DEPRECATED_GROQ_MODELS or "llama" in active_model:
            active_model = DEFAULT_GROQ_MODEL
            self.model_name = DEFAULT_GROQ_MODEL

        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()
                response_text = ""

                if self._client is not None:
                    chat_completion = self._client.chat.completions.create(
                        messages=messages,
                        model=active_model,
                        temperature=safe_temp,
                        max_tokens=max_tokens_val,
                    )
                    response_text = chat_completion.choices[0].message.content or ""
                else:
                    # Direct standard library HTTPS fallback when python groq package is not installed
                    import urllib.request
                    import json
                    req_data = json.dumps({
                        "model": active_model,
                        "messages": messages,
                        "temperature": safe_temp,
                        "max_tokens": max_tokens_val,
                    }).encode("utf-8")
                    req = urllib.request.Request(
                        "https://api.groq.com/openai/v1/chat/completions",
                        data=req_data,
                        headers={
                            "Authorization": f"Bearer {self.api_key.strip()}",
                            "Content-Type": "application/json",
                            "User-Agent": "LumoraAI/1.0 (Groq-Client)",
                        },
                        method="POST"
                    )
                    with urllib.request.urlopen(req, timeout=40) as resp:
                        res_json = json.loads(resp.read().decode("utf-8"))
                        response_text = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")

                latency = round(time.time() - start_time, 2)

                return {
                    "text": response_text,
                    "error": None,
                    "model_used": active_model,
                    "latency": latency,
                }

            except Exception as e:
                err_msg = str(e)
                # Check for transient rate limit or network error to retry with backoff
                is_rate_limit = "rate_limit_exceeded" in err_msg or "429" in err_msg
                if attempt < max_retries:
                    backoff = 2.0 * (attempt + 1) + random.uniform(0.2, 0.8)
                    time.sleep(backoff)
                    continue

                if is_rate_limit:
                    return {
                        "text": (
                            "⏳ **Groq Rate Limit Exceeded**: Request volume reached your Groq plan quota.\n\n"
                            "**Recommendation**: Please wait a few seconds before asking another question."
                        ),
                        "error": "RATE_LIMIT_EXCEEDED",
                        "model_used": active_model,
                    }
                elif "invalid_api_key" in err_msg or "401" in err_msg:
                    return {
                        "text": "🔑 **Authentication Failed**: The configured `GROQ_API_KEY` was rejected by Groq. Please check your key at [console.groq.com/keys](https://console.groq.com/keys).",
                        "error": "AUTH_ERROR",
                        "model_used": active_model,
                    }
                elif "model_not_found" in err_msg or "404" in err_msg or "deprecated" in err_msg:
                    return {
                        "text": (
                            f"⚠️ **Model Unavailable**: The model `{active_model}` is not accessible on your current Groq plan.\n\n"
                            f"Default production model has been switched to `{DEFAULT_GROQ_MODEL}` (or choose from {', '.join([f'`{m}`' for m in SUPPORTED_GROQ_MODELS])} in settings)."
                        ),
                        "error": "MODEL_ERROR",
                        "model_used": active_model,
                    }

                # Retry on transient network errors
                if attempt < max_retries:
                    backoff = (attempt + 1) * 1.5 + random.uniform(0.1, 0.5)
                    time.sleep(backoff)
                else:
                    return {
                        "text": f"⚠️ **Groq API Error**: {err_msg}",
                        "error": "API_ERROR",
                        "model_used": active_model,
                    }

    def summarize_text(self, text: str, mode: str = "bullets") -> Dict[str, Any]:
        """Summarize user-provided text preserving core meaning."""
        mode_instructions = {
            "short": "Provide a brief ~80 word executive summary.",
            "detailed": "Provide a detailed multi-paragraph conceptual summary.",
            "bullets": "Extract 4-6 core bullet points.",
            "takeaways": "Highlight the key insights and main conclusions.",
        }
        prompt = (
            f"Please summarize the following text according to this style: {mode_instructions.get(mode, 'Extract core bullet points')}.\n"
            f"Preserve the original meaning faithfully without hallucinating outside details:\n\n"
            f"---\n{text}\n---"
        )
        return self.generate_response(user_message=prompt)

    def generate_code_solution(self, task_description: str, language: str = "Python") -> Dict[str, Any]:
        """Generate verified, commented code in any supported programming language."""
        prompt = (
            f"Write a clean, self-contained solution in {language} for the following task:\n"
            f"Task: {task_description}\n\n"
            f"Requirements:\n"
            f"1. Include necessary imports / headers.\n"
            f"2. Add clear comments explaining logic.\n"
            f"3. Provide example usage / test case.\n"
            f"4. Analyze the time and space complexity (Big-O notation)."
        )
        return self.generate_response(user_message=prompt, target_language=language)


# Backward compatibility alias
SmartAskEngine = LumoraEngine
