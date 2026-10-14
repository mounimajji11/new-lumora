# ✨ Lumora AI — Advanced LLM Chatbot (Groq LPU Engine)

> **Tagline:** Ask anything. Understand more.  
> **Brand Meaning:** Lumora represents clarity, illumination, learning, and intellectual empowerment through artificial intelligence.  
> **Inference Engine:** Powered by **Groq Cloud** using **OpenAI GPT-OSS 20B (`openai/gpt-oss-20b`)** on custom Language Processing Units (LPUs) for ultra-low latency.  
> **Architecture:** Pure JavaScript (React + JSX frontend, Node.js proxy backend) with companion Python modules for academic benchmarking.  
> **Color Theme:** Obsidian (`#111713`) + Jade (`#53D6A3`) + Warm Ivory (`#F3F1E8`).

---

## 📑 1. Project Abstract

Large Language Models (LLMs) have transformed software development, tutoring, and conversational reasoning. However, mainstream cloud APIs often exhibit high latency.

**Lumora AI** is an advanced, general-purpose AI assistant engineered for high-throughput, low-latency reasoning using **Groq's Language Processing Unit (LPU)** infrastructure. Rather than training a model from scratch—which requires millions of dollars in compute—Lumora AI interfaces with the verified production model **OpenAI GPT-OSS 20B** (`openai/gpt-oss-20b`), an open-weight Mixture-of-Experts (MoE) foundation model with 128k context window, through the official Groq API and SDK.

The project features:
1. **Ultra-Low Latency Inference:** Groq's custom Tensor Streaming Processor silicon generates responses at hundreds of tokens per second using `openai/gpt-oss-20b`.
2. **Epistemic System Prompting:** Categorizing answers into [Verified Facts] versus [Estimates, Hypotheses, or Opinions], and strictly commanding the model to admit uncertainty rather than hallucinating.
3. **Multi-Language Code Studio:** Programming support across 20+ languages (Python, Java, JavaScript, TypeScript, C, C++, C#, Go, Rust, SQL, Bash) with Big-O complexity analysis and bug localization.
4. **Pure JavaScript / JSX Implementation:** Built in standard JavaScript and React without TypeScript compiler dependencies.
5. **Obsidian + Jade Design System:** A distinctive dark theme built on deep obsidian tones (`#111713`), vivid jade accents (`#53D6A3`), and warm ivory typography (`#F3F1E8`), accompanied by a light mode toggle.

---

## 🏗️ 2. System Architecture & Flow

```
                      ┌────────────────────────────────────────┐
                      │          User (Web Browser)            │
                      └──────────────────┬─────────────────────┘
                                         │ (1) User Inquiry / Multi-Turn
                                         ▼
                      ┌────────────────────────────────────────┐
                      │         Lumora AI Frontend             │
                      │         (React + Pure JSX)             │
                      │  - Obsidian + Jade Design System       │
                      │  - Multi-Language Code Studio          │
                      │  - Epistemic Text Summarizer           │
                      │  - Groq Model: openai/gpt-oss-20b      │
                      └──────────────────┬─────────────────────┘
                                         │ (2) POST /api/chat
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      Node.js Server-Side Proxy         │
                      │           (vite.config.js)             │
                      │  - Secure GROQ_API_KEY from env        │
                      │  - Reads GROQ_DEFAULT_MODEL config     │
                      │  - Exponential Backoff with Jitter     │
                      │  - Rate Limit (429) Friendly Guard     │
                      └──────────────────┬─────────────────────┘
                                         │ (3) Official groq-sdk
                                         ▼
                      ┌────────────────────────────────────────┐
                      │       Groq Cloud LPU Cluster           │
                      │         (openai/gpt-oss-20b)           │
                      │  - 20B MoE (3.6B Active Parameters)    │
                      │  - Custom Tensor Streaming Processors  │
                      │  - 128k Context Window Support         │
                      │  - 300+ Tokens / Second Generation     │
                      └──────────────────┬─────────────────────┘
                                         │ (4) High-Speed Response
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    Lumora AI Response Delivery         │
                      │  - [VERIFIED FACTS] & Structured Text  │
                      │  - [ESTIMATES / PERSPECTIVES]          │
                      │  - Syntax-Highlighted Code Blocks      │
                      └────────────────────────────────────────┘
```

---

## 🎨 3. Visual Design System: Obsidian, Jade & Warm Ivory

Lumora AI completely replaces traditional generic blue-purple styling with a bespoke, organic palette:

| Element | Color Hex | Role |
| :--- | :--- | :--- |
| **Main Background** | `#111713` | Deep obsidian base minimizing eye strain |
| **Sidebar Background** | `#0C120F` | Darker charcoal obsidian for depth |
| **Primary Accent** | `#53D6A3` | Radiant jade green for primary actions & logos |
| **Secondary Accent** | `#A6E8CC` | Soft mint jade for highlights & badges |
| **Main Text** | `#F3F1E8` | Warm ivory ensuring accessible contrast |
| **Secondary Text** | `#A0AEA4` | Muted sage for metadata & captions |
| **Borders & Dividers** | `#29382F` | Subtle obsidian borders |
| **Assistant Bubble** | `#19221C` | Elevated slate-obsidian with jade borders |
| **User Bubble** | `#B5EBD0` | High-contrast mint-sage with dark green text (`#14251B`) |
| **Code Block Canvas** | `#0A0F0C` | High-contrast dark editor canvas |
| **Error Color** | `#E57373` | Muted coral avoiding harsh red glare |
| **Success Color** | `#53D6A3` | Jade green verification badges |

---

## 🛠️ 4. Technology Stack & Supported Models

* **Frontend:** React 19 with Pure JavaScript and JSX (`src/App.jsx`, `src/main.jsx`).
* **Styling:** Tailwind CSS with custom CSS variables (`src/index.css`) for instant Dark/Light theme switching.
* **Backend:** Node.js server middleware configured in `vite.config.js` running the official `groq-sdk`.
* **Inference Engine:** Groq Cloud LPU with production models:
  * `openai/gpt-oss-20b` (**Default & Recommended**, Ultra-Fast 20B Mixture-of-Experts with 128k context)
  * `openai/gpt-oss-120b` (High-Capability 120B MoE Flagship with 128k context)
  * `qwen/qwen3.6-27b` (27B Reasoning & Mathematics)
  * `qwen/qwen3.8-27b` (27B Multimodal & Instruct)
* **Model Migration Note:** Decommissioned legacy models (`llama-3.3-70b-versatile` and `llama-3.1-8b-instant`) are automatically migrated to `openai/gpt-oss-20b` across all API routes, preserving reliability.
* **Python Companion Suite:** Retained in `app.py`, `chatbot_engine.py`, and `evaluate.py` to allow running standalone Python college lab demonstrations with the `groq` Python SDK.

---

## 💻 5. Installation & Execution Guide (Windows PowerShell)

Follow these exact commands in **Windows PowerShell**:

### Step 1: Open PowerShell in Project Folder
```powershell
cd C:\path\to\lumora-ai
```

### Step 2: Install Node.js Dependencies
```powershell
npm install
```

### Step 3: Configure Environment Variables
Create your local `.env` file from the provided example:
```powershell
Copy-Item .env.example .env
notepad .env
```
Ensure your `.env` contains:
```env
GROQ_API_KEY="gsk_YourActualGroqApiKeyHere..."
GROQ_DEFAULT_MODEL="openai/gpt-oss-20b"
```

### Step 4: Run the Lumora AI Web Application (Port 3000)
```powershell
npm run dev
```
Open your browser at:
`http://localhost:3000`

### Step 5: (Optional) Run the Python Demonstration Suite
If you want to run the companion Streamlit app:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run app.py
```
To run the automated verification benchmark:
```powershell
python evaluate.py
```

---

## 🧪 6. Automated Benchmark Suite (`evaluate.py`)

The benchmark harness verifies 8 core competencies:

1. **LUM-01 (Physics Constant):** Speed of light in vacuum (`299,792,458 m/s`).
2. **LUM-02 (Cell Biology):** Mitochondria cellular respiration & ATP production.
3. **LUM-03 (Algorithms):** Binary search time complexity ($O(\log n)$ average/worst, $O(1)$ best).
4. **LUM-04 (Java vs JavaScript):** Distinguishes Java `StringBuilder.reverse()` from JavaScript array reversal (never confusing syntax).
5. **LUM-05 (Trap Query / Humility):** Asks for the "89th US President"—the model **must refute the false premise** rather than fabricating a name.
6. **LUM-06 (Trade Secret Refusal):** Asks for Coca-Cola 7X formula—the model **must admit it is a confidential trade secret**.
7. **LUM-07 (Space Exploration):** Astronomical recall regarding James Webb Space Telescope and its L2 orbit.
8. **LUM-08 (Python Prime Checker):** Generates optimized prime checking code up to $\sqrt{n}$.

---

## 🎤 7. College Viva Voce Defense Script

### 2-Minute Elevator Pitch for your Professor:
> *"Respected Evaluators, our capstone project is **Lumora AI** ('Ask anything. Understand more.').
> Lumora AI is a general-purpose AI assistant that interfaces with the **OpenAI GPT-OSS 20B** foundation model hosted on **Groq's Language Processing Unit (LPU)** cloud.
> Unlike general GPU deployments that suffer from high latency, Groq's custom tensor architecture enables token generation at hundreds of words per second.
> Furthermore, we engineered strict **Epistemic System Prompting** that classifies statements into verified facts, estimates, and opinions, and commands the model to refuse false premises (such as asking for an 89th US President).
> The client is built with pure JavaScript and JSX under an Obsidian and Jade design system. Let me demonstrate the live system..."*

---

## ⚠️ 8. Security & Limitations

* **Server-Side API Key:** `GROQ_API_KEY` is loaded exclusively on the server side (`vite.config.js` or `chatbot_engine.py`). It is never bundled into browser code.
* **Rate Limits:** Groq's free tier provides high token rates but enforces requests-per-minute (RPM) limits. The backend handles 429 exceptions with exponential backoff and friendly user notifications.
#   n e w - l u m o r a  
 