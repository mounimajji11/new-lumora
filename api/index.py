"""
Lumora AI — Production Vercel Serverless Function API Entrypoint
Tagline: Ask anything. Understand more.
Framework: Python 3 (Flask + WSGI + BaseHTTPRequestHandler Universal Bridge)
Provides:
  - GET  /api/models   (supported models metadata)
  - POST /api/chat     (Groq LPU chat completion)
  - GET  /api/health   (service health and configuration status)
  - GET  /api/files    (in-app project files inspector)
  - POST /api/evaluate (college benchmark evaluation)
"""

import os
import sys
import json
import time
from typing import Dict, Any, Tuple

# Ensure project root is in sys.path for robust imports on Vercel
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from chatbot_engine import (
    LumoraEngine,
    DEFAULT_GROQ_MODEL,
    SUPPORTED_GROQ_MODELS,
    SUPPORTED_GROQ_MODELS_METADATA,
    DEPRECATED_GROQ_MODELS,
)


def get_models_payload() -> Dict[str, Any]:
    """Return supported models metadata."""
    return {
        "defaultModel": DEFAULT_GROQ_MODEL,
        "supportedModels": SUPPORTED_GROQ_MODELS_METADATA,
        "deprecatedModels": DEPRECATED_GROQ_MODELS,
        "recommendedMigration": DEFAULT_GROQ_MODEL,
    }


def get_health_payload() -> Dict[str, Any]:
    """Return health check & configuration status."""
    env_key = os.getenv("GROQ_API_KEY", "").strip()
    has_env = bool(env_key and env_key not in ("", "your_groq_api_key_here"))
    return {
        "status": "ok",
        "application": "Lumora AI",
        "tagline": "Ask anything. Understand more.",
        "hasEnvKey": has_env,
        "defaultModel": DEFAULT_GROQ_MODEL,
        "model": DEFAULT_GROQ_MODEL,
        "supportedModels": SUPPORTED_GROQ_MODELS_METADATA,
        "deprecatedModels": DEPRECATED_GROQ_MODELS,
        "provider": "Groq LPU Inference Engine",
    }


def get_files_payload() -> Dict[str, Any]:
    """Return contents of core project files for in-app code inspector."""
    file_names = [
        "app.py",
        "chatbot_engine.py",
        "evaluate.py",
        "test_chatbot.py",
        "requirements.txt",
        ".env.example",
        ".gitignore",
        "README.md",
    ]
    files_data = {}
    for fname in file_names:
        fpath = os.path.join(ROOT_DIR, fname)
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    files_data[fname] = f.read()
            except Exception:
                pass
    return {"files": files_data}


def handle_chat_request(body: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    """Process incoming chat request and generate Groq completion."""
    message = (body.get("message") or "").strip()
    if not message:
        return 400, {
            "error": "EMPTY_MESSAGE",
            "text": "Please provide a message or inquiry.",
        }

    api_key_override = (body.get("apiKeyOverride") or "").strip()
    env_key = os.getenv("GROQ_API_KEY", "").strip()
    api_key = api_key_override if api_key_override else env_key

    if not api_key or api_key in ("", "your_groq_api_key_here"):
        return 400, {
            "error": "MISSING_API_KEY",
            "text": (
                "🔑 **Groq API Key Required**: Lumora AI requires a valid Groq API key to generate high-speed responses. "
                "Please configure `GROQ_API_KEY` in your Vercel project environment variables.\n\n"
                "You can generate an API key at [console.groq.com/keys](https://console.groq.com/keys)."
            ),
        }

    requested_model = body.get("model") or DEFAULT_GROQ_MODEL
    # Filter out deprecated models automatically
    if (
        requested_model in DEPRECATED_GROQ_MODELS
        or "llama" in requested_model.lower()
        or "versatile" in requested_model.lower()
        or "instant" in requested_model.lower()
    ):
        active_model = DEFAULT_GROQ_MODEL
    elif not any(m["id"] == requested_model for m in SUPPORTED_GROQ_MODELS_METADATA):
        active_model = DEFAULT_GROQ_MODEL
    else:
        active_model = requested_model

    history = body.get("history") or []
    mode = body.get("mode") or "general"
    programming_language = body.get("programmingLanguage") or "auto"
    temperature = body.get("temperature", 0.3)
    response_style = body.get("responseStyle") or "Balanced"
    response_language = body.get("responseLanguage") or "Auto-detect"

    try:
        engine = LumoraEngine(api_key=api_key, model_name=active_model)
        result = engine.generate_response(
            user_message=message,
            conversation_history=history,
            temperature=temperature,
            target_language=programming_language,
            response_style=response_style,
            mode=mode,
            response_language=response_language,
        )

        err = result.get("error")
        if err:
            status_code = 500
            if err == "MISSING_API_KEY":
                status_code = 400
            elif err == "AUTH_ERROR":
                status_code = 401
            elif err == "RATE_LIMIT_EXCEEDED":
                status_code = 429
            elif err == "MODEL_ERROR":
                status_code = 404

            return status_code, {
                "error": err,
                "text": result.get("text", "Unable to generate response from Groq API."),
                "modelUsed": result.get("model_used", active_model),
            }

        return 200, {
            "text": result.get("text", ""),
            "latency": result.get("latency", 0.0),
            "modelUsed": result.get("model_used", active_model),
            "provider": "Groq LPU Cloud",
        }

    except Exception as exc:
        return 500, {
            "error": "SERVER_ERROR",
            "text": f"⚠️ Unexpected server error: {str(exc)}",
        }


def handle_evaluate_request(body: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    """Process live benchmark evaluation for college demonstration."""
    api_key_override = (body.get("apiKeyOverride") or "").strip()
    env_key = os.getenv("GROQ_API_KEY", "").strip()
    api_key = api_key_override if api_key_override else env_key

    if not api_key or api_key in ("", "your_groq_api_key_here"):
        return 400, {
            "error": "MISSING_API_KEY",
            "message": "A valid GROQ_API_KEY is required to execute the live evaluation benchmark.",
        }

    model = body.get("model") or DEFAULT_GROQ_MODEL
    if model in DEPRECATED_GROQ_MODELS or "llama" in model:
        model = DEFAULT_GROQ_MODEL

    from evaluate import BENCHMARK_CASES

    results = []
    engine = LumoraEngine(api_key=api_key, model_name=model)

    for case in BENCHMARK_CASES[:4]:  # Quick subset for interactive preview
        res = engine.generate_response(case["question"])
        text = res.get("text", "")
        facts_found = [f for f in case["expected_facts"] if f.lower() in text.lower()]
        passed = len(facts_found) > 0 if not case.get("expect_uncertainty") else True
        results.append({
            "id": case["id"],
            "category": case["category"],
            "question": case["question"],
            "passed": passed,
            "responseSnippet": text[:150] + "..." if len(text) > 150 else text,
            "latency": res.get("latency", 0.0),
        })

    passed_count = sum(1 for r in results if r["passed"])
    score_percentage = round((passed_count / max(len(results), 1)) * 100, 1)

    return 200, {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalTests": len(results),
        "passedTests": passed_count,
        "scorePercentage": score_percentage,
        "details": results,
        "model": model,
    }


# =============================================================================
# Universal WSGI Application / Flask Integration
# =============================================================================
try:
    from flask import Flask, request, jsonify, make_response

    app = Flask(__name__)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    @app.route("/", methods=["GET", "OPTIONS"])
    @app.route("/api", methods=["GET", "OPTIONS"])
    def route_root():
        if request.method == "OPTIONS":
            return "", 204
        return jsonify(get_health_payload())

    @app.route("/api/models", methods=["GET", "OPTIONS"])
    @app.route("/models", methods=["GET", "OPTIONS"])
    def route_models():
        if request.method == "OPTIONS":
            return "", 204
        return jsonify(get_models_payload())

    @app.route("/api/health", methods=["GET", "OPTIONS"])
    @app.route("/health", methods=["GET", "OPTIONS"])
    def route_health():
        if request.method == "OPTIONS":
            return "", 204
        return jsonify(get_health_payload())

    @app.route("/api/files", methods=["GET", "OPTIONS"])
    @app.route("/files", methods=["GET", "OPTIONS"])
    def route_files():
        if request.method == "OPTIONS":
            return "", 204
        return jsonify(get_files_payload())

    @app.route("/api/chat", methods=["POST", "OPTIONS"])
    @app.route("/chat", methods=["POST", "OPTIONS"])
    def route_chat():
        if request.method == "OPTIONS":
            return "", 204
        data = request.get_json(silent=True) or {}
        status_code, payload = handle_chat_request(data)
        return jsonify(payload), status_code

    @app.route("/api/evaluate", methods=["POST", "OPTIONS"])
    @app.route("/evaluate", methods=["POST", "OPTIONS"])
    def route_evaluate():
        if request.method == "OPTIONS":
            return "", 204
        data = request.get_json(silent=True) or {}
        status_code, payload = handle_evaluate_request(data)
        return jsonify(payload), status_code

except ImportError:
    # Fallback to pure WSGI application if Flask is not installed
    def app(environ, start_response):
        path = environ.get("PATH_INFO", "")
        method = environ.get("REQUEST_METHOD", "GET").upper()

        cors_headers = [
            ("Content-Type", "application/json"),
            ("Access-Control-Allow-Origin", "*"),
            ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
            ("Access-Control-Allow-Headers", "Content-Type, Authorization"),
        ]

        if method == "OPTIONS":
            start_response("204 No Content", cors_headers)
            return [b""]

        clean_path = path.rstrip("/")
        if clean_path in ("", "/", "/api", "/api/health", "/health") and method == "GET":
            payload = get_health_payload()
            body_bytes = json.dumps(payload).encode("utf-8")
            start_response("200 OK", cors_headers)
            return [body_bytes]

        if clean_path in ("/api/models", "/models") and method == "GET":
            payload = get_models_payload()
            body_bytes = json.dumps(payload).encode("utf-8")
            start_response("200 OK", cors_headers)
            return [body_bytes]

        if clean_path in ("/api/files", "/files") and method == "GET":
            payload = get_files_payload()
            body_bytes = json.dumps(payload).encode("utf-8")
            start_response("200 OK", cors_headers)
            return [body_bytes]

        if clean_path in ("/api/chat", "/chat") and method == "POST":
            try:
                content_length = int(environ.get("CONTENT_LENGTH", 0) or 0)
            except ValueError:
                content_length = 0
            req_body_raw = environ["wsgi.input"].read(content_length) if content_length > 0 else b"{}"
            try:
                body_json = json.loads(req_body_raw.decode("utf-8")) if req_body_raw else {}
            except Exception:
                body_json = {}

            status_code, payload = handle_chat_request(body_json)
            body_bytes = json.dumps(payload).encode("utf-8")
            status_text = f"{status_code} {'OK' if status_code == 200 else 'Error'}"
            start_response(status_text, cors_headers)
            return [body_bytes]

        if clean_path in ("/api/evaluate", "/evaluate") and method == "POST":
            try:
                content_length = int(environ.get("CONTENT_LENGTH", 0) or 0)
            except ValueError:
                content_length = 0
            req_body_raw = environ["wsgi.input"].read(content_length) if content_length > 0 else b"{}"
            try:
                body_json = json.loads(req_body_raw.decode("utf-8")) if req_body_raw else {}
            except Exception:
                body_json = {}

            status_code, payload = handle_evaluate_request(body_json)
            body_bytes = json.dumps(payload).encode("utf-8")
            status_text = f"{status_code} {'OK' if status_code == 200 else 'Error'}"
            start_response(status_text, cors_headers)
            return [body_bytes]

        # 404 fallback
        start_response("404 Not Found", cors_headers)
        return [json.dumps({"error": "NOT_FOUND", "message": f"Route {path} not found"}).encode("utf-8")]


# =============================================================================
# BaseHTTPRequestHandler Bridge for Vercel Legacy Function Format
# =============================================================================
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def _send_json_response(self, status_code: int, payload: Dict[str, Any]):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/")
        if path in ("", "/", "/api", "/api/health", "/health"):
            self._send_json_response(200, get_health_payload())
        elif path in ("/api/models", "/models"):
            self._send_json_response(200, get_models_payload())
        elif path in ("/api/files", "/files"):
            self._send_json_response(200, get_files_payload())
        else:
            self._send_json_response(404, {"error": "NOT_FOUND", "message": f"Route {self.path} not found"})

    def do_POST(self):
        path = self.path.split("?")[0].rstrip("/")
        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except (TypeError, ValueError):
            content_length = 0
        raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            data = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except Exception:
            data = {}

        if path in ("/api/chat", "/chat"):
            status_code, payload = handle_chat_request(data)
            self._send_json_response(status_code, payload)
        elif path in ("/api/evaluate", "/evaluate"):
            status_code, payload = handle_evaluate_request(data)
            self._send_json_response(status_code, payload)
        else:
            self._send_json_response(404, {"error": "NOT_FOUND", "message": f"Route {self.path} not found"})
