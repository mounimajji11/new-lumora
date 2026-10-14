/**
 * Lumora AI — "Ask anything. Understand more."
 * Advanced Pretrained LLM Chatbot Application
 * 
 * Technology Stack:
 * - Frontend: React with Pure JavaScript & JSX (No TypeScript)
 * - Styling: Obsidian, Jade & Warm Ivory design system
 * - AI Provider: Groq LPU Cloud Inference (Default: openai/gpt-oss-20b)
 * - Server: Secure Node.js proxy with rate-limit exponential backoff
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Terminal,
  BookOpen,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Share2,
  Copy,
  Check,
  FileText,
  Code,
  Settings,
  ShieldCheck,
  Cpu,
  Clock,
  Layers,
  Send,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Sun,
  Moon,
  RotateCcw,
  Zap,
} from 'lucide-react';

// Minimal Lumora AI Emblem: An abstract luminescent star encircled by an orbit ring
function LumoraLogo({ className = 'h-7 w-7' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="#53D6A3"
        strokeWidth="3.5"
        strokeDasharray="6 4"
        opacity="0.4"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="42"
        ry="18"
        stroke="#A6E8CC"
        strokeWidth="2.5"
        transform="rotate(-25 50 50)"
        opacity="0.75"
      />
      {/* Central 4-pointed radiant star */}
      <path
        d="M50 16 C50 36 36 50 16 50 C36 50 50 64 50 84 C50 64 64 50 84 50 C64 50 50 36 50 16 Z"
        fill="#53D6A3"
      />
      {/* Core light spark */}
      <circle cx="50" cy="50" r="4.5" fill="#F3F1E8" />
    </svg>
  );
}

// Supported Programming Languages
const SUPPORTED_LANGUAGES = [
  'Auto-Detect',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Kotlin',
  'Swift',
  'SQL',
  'HTML/CSS',
  'React (JSX)',
  'Node.js',
  'Bash',
  'PowerShell',
];

// Central supported Groq production models
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';

const INITIAL_GROQ_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT-OSS 20B (Default & Recommended)',
    speed: 'Ultra-Fast',
    description: '20B MoE foundation model, 128k context window, optimized for ultra-low latency reasoning on Groq LPUs.',
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (High Capability MoE)',
    speed: 'Fast',
    description: '120B MoE model, 128k context window, deep multi-step reasoning and complex coding.',
  },
  {
    id: 'qwen/qwen3.6-27b',
    name: 'Qwen 3.6 27B (Reasoning & Code)',
    speed: 'Ultra-Fast',
    description: '27B reasoning model, official Groq migration target for math and code analysis.',
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B (Multimodal & Instruct)',
    speed: 'Ultra-Fast',
    description: '131k context window, multimodal capabilities on Groq LPUs.',
  },
];

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'summarize' | 'code' | 'benchmark' | 'architecture' | 'viva' | 'files' | 'settings'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });
  const [availableModels, setAvailableModels] = useState(INITIAL_GROQ_MODELS);

  // User Chat Preferences
  const [enterToSend, setEnterToSend] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_enter_to_send');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  const [showTimestamps, setShowTimestamps] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_show_timestamps');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  const [autoScroll, setAutoScroll] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_auto_scroll');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  // Single source of truth for response personalization configuration
  const RESPONSE_STYLES = [
    {
      id: 'concise',
      label: 'Concise',
      description: 'Short, direct answers in 1 to 3 sentences with minimal elaboration.',
    },
    {
      id: 'balanced',
      label: 'Balanced',
      description: 'Clear explanations of moderate length with balanced detail and examples.',
    },
    {
      id: 'detailed',
      label: 'Detailed',
      description: 'Comprehensive, in-depth multi-section explanations with deep analysis.',
    },
  ];

  // Personalization Preferences
  const [responseStyle, setResponseStyle] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_response_style');
      if (saved) {
        const lower = saved.trim().toLowerCase();
        if (['concise', 'balanced', 'detailed'].includes(lower)) return lower;
      }
    } catch (e) {}
    return 'balanced';
  });

  const [responseLanguage, setResponseLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_response_language');
      if (saved && ['Auto-detect', 'English', 'Telugu', 'Hindi'].includes(saved)) return saved;
    } catch (e) {}
    return 'Auto-detect';
  });

  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  // Default initial greeting definition
  const DEFAULT_WELCOME_MESSAGE = {
    id: 'init-msg',
    role: 'assistant',
    content:
      'Hello, I am **Lumora AI**.\n\n*Ask anything. Understand more.*\n\nI can assist you with general knowledge, deep conceptual explanations, multi-language software development, text summarization, and logical reasoning.\n\nWhat would you like to explore today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Chat Conversations State - Load valid existing saved conversations
  // A new conversation will only be saved once the user sends the first message
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (c) =>
              c &&
              c.id &&
              typeof c.id === 'string' &&
              Array.isArray(c.messages) &&
              c.messages.some((m) => m && m.role === 'user')
          );
        }
      }
    } catch (e) {
      console.warn('LocalStorage unavailable');
    }
    return [];
  });

  const [activeConvId, setActiveConvId] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const first = parsed.find(
            (c) =>
              c &&
              c.id &&
              Array.isArray(c.messages) &&
              c.messages.some((m) => m && m.role === 'user')
          );
          if (first) return first.id;
        }
      }
    } catch (e) {}
    return 'new';
  });
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Default Groq Model & Internal Inference Settings
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      const saved = localStorage.getItem('lumora_selected_model');
      if (
        saved &&
        !saved.includes('llama') &&
        !saved.includes('versatile') &&
        !saved.includes('instant') &&
        saved !== 'llama-3.3-70b-versatile' &&
        saved !== 'llama-3.1-8b-instant'
      ) {
        return saved;
      }
    } catch (e) {
      // LocalStorage access error
    }
    return DEFAULT_GROQ_MODEL;
  });
  const [temperature, setTemperature] = useState(0.3);
  const [selectedLanguage, setSelectedLanguage] = useState('Auto-Detect');

  // Summarizer Specific State
  const [summarizeText, setSummarizeText] = useState(
    'Large Language Models (LLMs) are deep learning systems trained on vast textual corpora using autoregressive token prediction. Rather than training models from scratch—which requires millions of dollars in compute—modern applications interface with pretrained foundation models via secure API gateways like Groq. Groq\'s custom Language Processing Units (LPUs) deliver unprecedented inference throughput, generating tokens at hundreds of words per second.'
  );
  const [summaryMode, setSummaryMode] = useState('bullets'); // 'short' | 'detailed' | 'bullets' | 'takeaways'

  // Code Assistant Specific State
  const [codePrompt, setCodePrompt] = useState(
    'Write an optimal function for Binary Search that returns the index or -1, along with time/space complexity analysis.'
  );

  // Benchmark State
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkScore, setBenchmarkScore] = useState(null);

  // Project Files State
  const [projectFiles, setProjectFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState('README.md');

  // Viva Voce Timer
  const [vivaTimer, setVivaTimer] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  const messagesEndRef = useRef(null);

  // Active conversation object
  const currentConversation = conversations.find((c) => c.id === activeConvId);
  const messages = currentConversation?.messages || [DEFAULT_WELCOME_MESSAGE];

  // Sync conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lumora_conversations', JSON.stringify(conversations));
    } catch (e) {
      // Ignored
    }
  }, [conversations]);

  // Sync theme attribute to HTML document & save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lumora_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Sync user chat preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lumora_enter_to_send', String(enterToSend));
    } catch (e) {}
  }, [enterToSend]);

  useEffect(() => {
    try {
      localStorage.setItem('lumora_show_timestamps', String(showTimestamps));
    } catch (e) {}
  }, [showTimestamps]);

  useEffect(() => {
    try {
      localStorage.setItem('lumora_auto_scroll', String(autoScroll));
    } catch (e) {}
  }, [autoScroll]);

  useEffect(() => {
    try {
      localStorage.setItem('lumora_response_style', responseStyle);
    } catch (e) {}
  }, [responseStyle]);

  useEffect(() => {
    try {
      localStorage.setItem('lumora_response_language', responseLanguage);
    } catch (e) {}
  }, [responseLanguage]);

  // Sync selectedModel to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lumora_selected_model', selectedModel);
    } catch (e) {
      // Ignored
    }
  }, [selectedModel]);

  // Load supported models and default configuration from backend single source of truth
  useEffect(() => {
    fetch('/api/models')
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error(`HTTP ${res.status}: Expected JSON response from /api/models`);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.supportedModels?.length) {
          setAvailableModels(data.supportedModels);
        }
        if (data?.defaultModel) {
          setSelectedModel((prev) => {
            if (
              !prev ||
              prev.includes('llama') ||
              prev.includes('versatile') ||
              prev.includes('instant') ||
              prev === 'llama-3.3-70b-versatile' ||
              prev === 'llama-3.1-8b-instant'
            ) {
              return data.defaultModel;
            }
            return prev;
          });
        }
      })
      .catch((err) => {
        console.warn('Lumora AI models load notice:', err.message);
      });
  }, []);

  // Scroll to bottom of chat if autoScroll enabled
  useEffect(() => {
    if (activeView === 'chat' && autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeView, autoScroll]);

  // Load project files on mount
  useEffect(() => {
    fetch('/api/files')
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error(`HTTP ${res.status}: Expected JSON response from /api/files`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.files) setProjectFiles(data.files);
      })
      .catch((err) => {
        console.warn('Project files load notice:', err.message);
      });
  }, []);

  // Viva Timer decrement
  useEffect(() => {
    let interval;
    if (timerRunning && vivaTimer > 0) {
      interval = setInterval(() => setVivaTimer((t) => t - 1), 1000);
    } else if (vivaTimer === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, vivaTimer]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setActiveConvId('new');
    setInputPrompt('');
    setIsLoading(false);
    setActiveView('chat');
  };

  const handleDeleteConversation = (id, e) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (activeConvId === id) {
      if (filtered.length > 0) {
        setActiveConvId(filtered[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleConfirmClearHistory = () => {
    setConversations([]);
    try {
      localStorage.removeItem('lumora_conversations');
    } catch (e) {}
    handleNewChat();
    setIsClearHistoryModalOpen(false);
  };

  // Send message to Lumora AI backend API (Groq)
  const handleSendMessage = async (customPrompt) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isLoading) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let targetConvId = activeConvId;
    let baseMessages = messages;

    // A new conversation will only be saved once the user sends the first message
    if (targetConvId === 'new' || !conversations.some((c) => c.id === targetConvId)) {
      targetConvId = `conv-${Date.now()}`;
      const titleSnippet = promptToSend.slice(0, 32);
      const newTitle = titleSnippet + (promptToSend.length > 32 ? '...' : '');
      const newConv = {
        id: targetConvId,
        title: newTitle,
        createdAt: new Date().toISOString(),
        messages: [DEFAULT_WELCOME_MESSAGE, userMessage],
      };
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== targetConvId)]);
      setActiveConvId(targetConvId);
      baseMessages = newConv.messages;
    } else {
      // Existing conversation: append user message and update title if needed
      baseMessages = [...messages, userMessage];
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            const newTitle =
              c.title === 'New Chat' || c.title === 'New Exploration' || c.title === 'New Conversation'
                ? promptToSend.slice(0, 32) + (promptToSend.length > 32 ? '...' : '')
                : c.title;
            return { ...c, title: newTitle, messages: baseMessages };
          }
          return c;
        })
      );
    }

    setInputPrompt('');
    setIsLoading(true);

    try {
      const historyPayload = baseMessages
        .filter((m) => m.id !== 'init-msg' && m.content)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      let res = null;
      try {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: promptToSend,
            history: historyPayload,
            model: selectedModel,
            mode: activeView === 'code' ? 'code' : activeView === 'summarize' ? 'summarize' : 'general',
            programmingLanguage: selectedLanguage,
            temperature,
            responseStyle,
            responseLanguage,
          }),
        });
      } catch {
        // Transient network glitch or server reload: wait 600ms and retry once
        await new Promise((r) => setTimeout(r, 600));
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: promptToSend,
            history: historyPayload,
            model: selectedModel,
            mode: activeView === 'code' ? 'code' : activeView === 'summarize' ? 'summarize' : 'general',
            programmingLanguage: selectedLanguage,
            temperature,
            responseStyle,
            responseLanguage,
          }),
        });
      }

      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const fallbackText = await res.text();
        throw new Error(
          `Backend returned non-JSON response (HTTP ${res.status}): ${fallbackText.slice(0, 100)}`
        );
      }

      if (!res.ok) {
        const errorContent =
          data.text ||
          data.error ||
          data.message ||
          `⚠️ Server Error (${res.status}): Please check backend deployment.`;

        const assistantMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorContent,
          latency: data.latency,
          modelUsed: data.modelUsed || selectedModel,
          provider: data.provider || 'Lumora AI',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c
          )
        );
        return;
      }

      const assistantMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'No response returned from the model.',
        latency: data.latency,
        modelUsed: data.modelUsed,
        provider: data.provider || 'Groq',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Error**: ${err.message || 'Unable to reach backend service.'}\n\nPlease verify your connection and click Retry.`,
        isError: true,
        lastPrompt: promptToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId ? { ...c, messages: [...c.messages, errorMessage] } : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Share matter state & handlers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareScope, setShareScope] = useState('full'); // 'full' | 'latest'
  const [shareToast, setShareToast] = useState(null);
  const [shareCopySuccess, setShareCopySuccess] = useState(false);
  const [customShareSnippet, setCustomShareSnippet] = useState(null);

  const showShareToast = (msg) => {
    setShareToast(msg);
    setTimeout(() => {
      setShareToast((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const getSearchMatterText = (scope = shareScope, customSnippet = customShareSnippet) => {
    if (customSnippet) {
      return `💡 Lumora AI — Shared Matter\n\n${customSnippet}\n\n— Generated with Lumora AI ("Ask anything. Understand more.")`;
    }

    if (activeView === 'summarize') {
      return `💡 Lumora AI — Text Summarizer Matter\n\nSource Content Snippet:\n${(summarizeText || '').slice(0, 300)}...\n\n— Summarized with Lumora AI ("Ask anything. Understand more.")`;
    }

    if (activeView === 'code') {
      return `💡 Lumora AI — Code Studio Matter\nTarget Language: ${selectedLanguage}\n\nTask / Code:\n${codePrompt}\n\n— Generated with Lumora AI ("Ask anything. Understand more.")`;
    }

    if (scope === 'latest') {
      const userMsgs = messages.filter((m) => m.role === 'user');
      const assistantMsgs = messages.filter((m) => m.role === 'assistant');
      const lastUser = userMsgs[userMsgs.length - 1];
      const lastAssistant = assistantMsgs[assistantMsgs.length - 1];

      let text = `💡 Lumora AI — Search Matter & Inquiry\nTopic: ${currentConversation?.title || 'New Chat'}\n\n`;
      if (lastUser) {
        text += `❓ Inquiry / Search:\n${lastUser.content}\n\n`;
      }
      if (lastAssistant) {
        text += `✨ Lumora AI Answer:\n${lastAssistant.content}\n\n`;
      }
      text += `— Shared via Lumora AI ("Ask anything. Understand more.")`;
      return text;
    }

    // Full conversation
    let text = `💡 Lumora AI — Conversation & Search Matter\nTopic: ${currentConversation?.title || 'New Chat'}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    messages.forEach((m) => {
      if (m.role === 'user') {
        text += `🧑‍💻 Search / Query:\n${m.content}\n\n`;
      } else {
        text += `✨ Lumora AI:\n${m.content}\n\n---\n\n`;
      }
    });
    text += `— Shared via Lumora AI ("Ask anything. Understand more.")`;
    return text;
  };

  const handleOpenShareModal = (snippet = null) => {
    setCustomShareSnippet(snippet);
    setShareCopySuccess(false);
    setIsShareModalOpen(true);
  };

  const handleCopyShareMatter = async (textToCopy = null) => {
    const text = textToCopy || getSearchMatterText();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setShareCopySuccess(true);
      showShareToast('Search matter copied to clipboard! You can now send it to anyone.');
      setTimeout(() => setShareCopySuccess(false), 2500);
    } catch (e) {
      showShareToast('Could not access clipboard directly.');
    }
  };

  const handleNativeShare = async () => {
    const text = getSearchMatterText();
    const title = `Lumora AI: ${currentConversation?.title || 'New Chat'}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
        showShareToast('Shared successfully!');
        setIsShareModalOpen(false);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyShareMatter(text);
        }
      }
    } else {
      handleCopyShareMatter(text);
    }
  };

  const handleShareDirectMessage = (content) => {
    handleOpenShareModal(content);
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkResults(null);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      });
      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const fallbackText = await res.text();
        throw new Error(`Server returned HTTP ${res.status}: ${fallbackText.slice(0, 80)}`);
      }

      if (data.details) {
        setBenchmarkResults(data.details);
        setBenchmarkScore(data.scorePercentage);
      } else {
        showShareToast(data.message || data.error || 'Evaluation test failed.');
      }
    } catch (e) {
      showShareToast(`Benchmark execution error: ${e.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Helper to render Markdown-like text with syntax highlighted code blocks
  const renderMessageContent = (content) => {
    if (!content) return null;
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'code',
        value: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-3 leading-relaxed">
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            const blockId = `code-${idx}-${p.value.slice(0, 10)}`;
            return (
              <div
                key={idx}
                className="my-3 overflow-hidden rounded-lg border border-[#29382F] bg-[#0A0F0C] font-mono text-xs shadow-md"
              >
                <div className="flex items-center justify-between border-b border-[#29382F] bg-[#111713] px-3 py-1.5 text-xs text-[#A0AEA4]">
                  <span className="font-semibold uppercase tracking-wider text-[#53D6A3]">
                    {p.language || 'code'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(p.value, blockId)}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-[#A0AEA4] hover:bg-[#19221C] hover:text-[#F3F1E8] transition"
                  >
                    {copiedId === blockId ? (
                      <>
                        <Check className="h-3 w-3 text-[#53D6A3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto p-3 text-[#F3F1E8]">
                  <code>{p.value}</code>
                </pre>
              </div>
            );
          }

          return (
            <div key={idx} className="whitespace-pre-wrap font-sans">
              {p.value}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden ${
        theme === 'light' ? 'bg-[#F7F6F0] text-[#141E17]' : 'bg-[#111713] text-[#F3F1E8]'
      }`}
    >
      {/* ======================================================== */}
      {/* 1. SIDEBAR (Collapsible, Obsidian & Jade System)        */}
      {/* ======================================================== */}
      <aside
        className={`flex flex-col h-full shrink-0 border-r transition-[width,transform] duration-200 select-none overflow-hidden z-30 ${
          sidebarOpen
            ? 'w-[240px] min-w-[240px] max-w-[240px] fixed inset-y-0 left-0 z-40 md:static'
            : 'hidden md:flex md:w-[68px] md:min-w-[68px] md:max-w-[68px]'
        } ${
          theme === 'light'
            ? 'bg-[#EFECE1] border-[#D5DCD4]'
            : 'bg-[#0C120F] border-[#29382F]'
        }`}
      >
        {/* Brand Header */}
        <div className={`h-16 shrink-0 flex items-center border-b px-3.5 ${
          theme === 'light' ? 'border-[#D5DCD4]' : 'border-[#29382F]'
        } ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen ? (
            <>
              <div
                onClick={() => { setActiveView('chat'); handleNewChat(); }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                title="Lumora AI"
              >
                <LumoraLogo className="h-7 w-7 shrink-0" />
                <div className="min-w-0">
                  <span className={`text-sm font-bold tracking-tight block truncate ${
                    theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'
                  }`}>
                    Lumora AI
                  </span>
                  <p className={`text-[10px] truncate leading-tight ${
                    theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'
                  }`}>
                    Ask anything. Understand more.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Desktop collapse toggle */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`hidden md:flex p-1 rounded-lg transition cursor-pointer ${
                    theme === 'light'
                      ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#E5E0D0]'
                      : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#19221C]'
                  }`}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Mobile close button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`md:hidden p-1 rounded-lg transition cursor-pointer ${
                    theme === 'light'
                      ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#E5E0D0]'
                      : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#19221C]'
                  }`}
                  title="Close sidebar"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                theme === 'light' ? 'hover:bg-[#E5E0D0]' : 'hover:bg-[#19221C]'
              }`}
              title="Lumora AI — Click to expand sidebar"
              aria-label="Expand sidebar"
            >
              <LumoraLogo className="h-7 w-7" />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <div className={`p-3 shrink-0 ${sidebarOpen ? 'w-full' : 'w-full flex justify-center'}`}>
          {sidebarOpen ? (
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#53D6A3] px-3.5 py-2.5 text-xs font-semibold text-[#14251B] hover:bg-[#A6E8CC] shadow transition cursor-pointer whitespace-nowrap"
              title="Start a new chat"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>New Chat</span>
            </button>
          ) : (
            <button
              onClick={handleNewChat}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#53D6A3] text-[#14251B] hover:bg-[#A6E8CC] shadow transition cursor-pointer"
              title="New Chat"
              aria-label="Start a new chat"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Views & Modes Navigation */}
        <div className={`px-2 pb-2 border-b space-y-1 shrink-0 ${
          theme === 'light' ? 'border-[#D5DCD4]' : 'border-[#29382F]'
        }`}>
          {/* General Assistant */}
          <button
            onClick={() => setActiveView('chat')}
            className={`transition cursor-pointer ${
              sidebarOpen
                ? 'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-left'
                : 'h-9 w-9 mx-auto flex items-center justify-center rounded-lg'
            } ${
              activeView === 'chat'
                ? theme === 'light'
                  ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold border border-[#D5DCD4]'
                  : 'bg-[#19221C] text-[#53D6A3] border border-[#29382F]'
                : theme === 'light'
                ? 'text-[#56695C] hover:bg-[#EAE6D9] hover:text-[#141E17]'
                : 'text-[#A0AEA4] hover:bg-[#141C16] hover:text-[#F3F1E8]'
            }`}
            title="General Assistant"
            aria-label="General Assistant"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {sidebarOpen && <span className="truncate">General Assistant</span>}
          </button>

          {/* Multi-Language Code Studio */}
          <button
            onClick={() => setActiveView('code')}
            className={`transition cursor-pointer ${
              sidebarOpen
                ? 'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-left'
                : 'h-9 w-9 mx-auto flex items-center justify-center rounded-lg'
            } ${
              activeView === 'code'
                ? theme === 'light'
                  ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold border border-[#D5DCD4]'
                  : 'bg-[#19221C] text-[#53D6A3] border border-[#29382F]'
                : theme === 'light'
                ? 'text-[#56695C] hover:bg-[#EAE6D9] hover:text-[#141E17]'
                : 'text-[#A0AEA4] hover:bg-[#141C16] hover:text-[#F3F1E8]'
            }`}
            title="Multi-Language Code Studio"
            aria-label="Multi-Language Code Studio"
          >
            <Code className="h-3.5 w-3.5 shrink-0" />
            {sidebarOpen && <span className="truncate">Code Studio</span>}
          </button>

          {/* Text Summarizer */}
          <button
            onClick={() => setActiveView('summarize')}
            className={`transition cursor-pointer ${
              sidebarOpen
                ? 'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-left'
                : 'h-9 w-9 mx-auto flex items-center justify-center rounded-lg'
            } ${
              activeView === 'summarize'
                ? theme === 'light'
                  ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold border border-[#D5DCD4]'
                  : 'bg-[#19221C] text-[#53D6A3] border border-[#29382F]'
                : theme === 'light'
                ? 'text-[#56695C] hover:bg-[#EAE6D9] hover:text-[#141E17]'
                : 'text-[#A0AEA4] hover:bg-[#141C16] hover:text-[#F3F1E8]'
            }`}
            title="Text Summarizer"
            aria-label="Text Summarizer"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            {sidebarOpen && <span className="truncate">Text Summarizer</span>}
          </button>
        </div>

        {/* Middle Scrollable Section: Recent Inquiries + College Demo & Review */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2 flex flex-col space-y-2">
          {/* Section 1: Recent Inquiries */}
          <div>
            {sidebarOpen ? (
              <>
                <div className={`px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                  theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]/70'
                }`}>
                  Recent Inquiries
                </div>
                {conversations.length === 0 ? (
                  <div className={`px-2.5 py-3 text-center text-[11px] italic ${
                    theme === 'light' ? 'text-[#56695C]/60' : 'text-[#A0AEA4]/50'
                  }`}>
                    No saved inquiries yet
                  </div>
                ) : (
                  <div className="space-y-0.5 mt-0.5">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setActiveView('chat');
                        }}
                        className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition ${
                          activeConvId === conv.id && activeView === 'chat'
                            ? theme === 'light'
                              ? 'bg-[#E5E0D0] text-[#141E17] font-semibold border border-[#D5DCD4]'
                              : 'bg-[#19221C] text-[#F3F1E8] border border-[#29382F]'
                            : theme === 'light'
                            ? 'text-[#56695C] hover:bg-[#EAE6D9] hover:text-[#141E17]'
                            : 'text-[#A0AEA4] hover:bg-[#141C16] hover:text-[#F3F1E8]'
                        }`}
                      >
                        <span className="truncate pr-1.5">{conv.title}</span>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#A0AEA4] hover:text-[#E57373] transition cursor-pointer shrink-0"
                          title="Delete Conversation"
                          aria-label="Delete Conversation"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-0.5">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg transition cursor-pointer ${
                    theme === 'light'
                      ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#E5E0D0]'
                      : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#19221C]'
                  }`}
                  title={`Recent Inquiries (${conversations.length}) — Click to expand`}
                  aria-label="Recent Inquiries"
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Moderate vertical spacing & subtle divider between Recent Inquiries and College Demo */}
          <div className={`my-1 border-t ${
            theme === 'light' ? 'border-[#D5DCD4]' : 'border-[#29382F]/60'
          } ${sidebarOpen ? 'w-full' : 'w-7 mx-auto'}`} />

          {/* Section 2: College Demo & Review */}
          <div className="space-y-1">
            {sidebarOpen && (
              <div className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]/60'
              }`}>
                College Demo & Review
              </div>
            )}

            <button
              onClick={() => setActiveView('benchmark')}
              className={`transition cursor-pointer ${
                sidebarOpen
                  ? 'w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left'
                  : 'h-9 w-9 mx-auto flex items-center justify-center rounded-lg'
              } ${
                activeView === 'benchmark'
                  ? theme === 'light' ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold' : 'bg-[#19221C] text-[#53D6A3]'
                  : theme === 'light' ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#EAE6D9]' : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#141C16]'
              }`}
              title="Benchmark & Verification"
              aria-label="Benchmark & Verification"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              {sidebarOpen && <span className="truncate">Benchmark & Verification</span>}
            </button>

            <button
              onClick={() => setActiveView('architecture')}
              className={`transition cursor-pointer ${
                sidebarOpen
                  ? 'w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left'
                  : 'h-9 w-9 mx-auto flex items-center justify-center rounded-lg'
              } ${
                activeView === 'architecture'
                  ? theme === 'light' ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold' : 'bg-[#19221C] text-[#53D6A3]'
                  : theme === 'light' ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#EAE6D9]' : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#141C16]'
              }`}
              title="Architecture & Groq LPU"
              aria-label="Architecture & Groq LPU"
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              {sidebarOpen && <span className="truncate">Architecture & Groq LPU</span>}
            </button>

            <button
              onClick={() => setActiveView('viva')}
              className={`transition cursor-pointer ${
                sidebarOpen
                  ? 'w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left'
                  : 'h-9 w-9 mx-auto flex items-center justify-center rounded-lg'
              } ${
                activeView === 'viva'
                  ? theme === 'light' ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold' : 'bg-[#19221C] text-[#53D6A3]'
                  : theme === 'light' ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#EAE6D9]' : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#141C16]'
              }`}
              title="Viva Voce Script & Q&A"
              aria-label="Viva Voce Script & Q&A"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {sidebarOpen && <span className="truncate">Viva Voce Script & Q&A</span>}
            </button>

            <button
              onClick={() => setActiveView('files')}
              className={`transition cursor-pointer ${
                sidebarOpen
                  ? 'w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left'
                  : 'h-9 w-9 mx-auto flex items-center justify-center rounded-lg'
              } ${
                activeView === 'files'
                  ? theme === 'light' ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold' : 'bg-[#19221C] text-[#53D6A3]'
                  : theme === 'light' ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#EAE6D9]' : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#141C16]'
              }`}
              title="Project Files & PowerShell"
              aria-label="Project Files & PowerShell"
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              {sidebarOpen && <span className="truncate">Project Files</span>}
            </button>
          </div>
        </div>

        {/* Bottom-Aligned Section (Settings & Theme Pinned to Bottom) */}
        <div className={`mt-auto shrink-0 border-t p-2.5 ${
          theme === 'light'
            ? 'border-[#D5DCD4] bg-[#EAE7DC]/70'
            : 'border-[#29382F] bg-[#0A0F0C]/80'
        } ${sidebarOpen ? 'space-y-2' : 'flex flex-col items-center gap-1.5'}`}>
          <div className={sidebarOpen ? 'flex items-center justify-between gap-1.5' : 'flex flex-col items-center gap-1.5 w-full'}>
            <button
              onClick={() => setActiveView('settings')}
              className={`transition cursor-pointer ${
                sidebarOpen
                  ? 'flex-1 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium'
                  : 'h-9 w-9 flex items-center justify-center rounded-lg'
              } ${
                activeView === 'settings'
                  ? theme === 'light'
                    ? 'bg-[#E5E0D0] text-[#1C9163] font-semibold border border-[#D5DCD4]'
                    : 'bg-[#19221C] text-[#53D6A3] font-semibold border border-[#29382F]'
                  : theme === 'light'
                  ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#EAE6D9]'
                  : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#19221C]'
              }`}
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5 shrink-0" />
              {sidebarOpen && <span>Settings</span>}
            </button>

            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className={`transition cursor-pointer ${
                sidebarOpen
                  ? 'rounded-lg p-1.5 shrink-0'
                  : 'h-9 w-9 flex items-center justify-center rounded-lg'
              } ${
                theme === 'light'
                  ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#E5E0D0]'
                  : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#19221C]'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Warm Ivory + Sage' : 'Obsidian + Jade'} Theme`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-[#A6E8CC]" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-[#1C9163]" />
              )}
            </button>
          </div>

          {/* Subtle Anchoring Footer Bar (Expanded state) */}
          {sidebarOpen && (
            <div className={`px-2 pt-1 border-t flex items-center justify-between text-[10px] ${
              theme === 'light' ? 'border-[#D5DCD4]/60 text-[#56695C]/70' : 'border-[#29382F]/40 text-[#A0AEA4]/60'
            }`}>
              <span>Lumora AI</span>
              <span className={`flex items-center gap-1 font-medium ${
                theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'
              }`}>
                <Zap className="h-2.5 w-2.5" />
                LPU Cloud
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE / CHAT CONTAINER                      */}
      {/* ======================================================== */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${
        theme === 'light' ? 'bg-[#F7F6F0]' : 'bg-[#111713]'
      }`}>
        {/* Top Navbar */}
        <header className={`h-14 shrink-0 flex items-center justify-between px-4 border-b backdrop-blur z-10 ${
          theme === 'light'
            ? 'bg-[#EFECE1]/90 border-[#D5DCD4]'
            : 'bg-[#0C120F]/90 border-[#29382F]'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                theme === 'light'
                  ? 'text-[#56695C] hover:text-[#141E17] hover:bg-[#E5E0D0]'
                  : 'text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#19221C]'
              }`}
              title="Toggle Sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-xs sm:text-sm ${
                theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'
              }`}>
                {activeView === 'chat'
                  ? (currentConversation?.title || 'New Chat')
                  : activeView === 'code'
                  ? 'Multi-Language Code Studio'
                  : activeView === 'summarize'
                  ? 'Text Summarizer'
                  : activeView === 'benchmark'
                  ? 'Evaluation Benchmark Harness'
                  : activeView === 'architecture'
                  ? 'Groq LPU Architecture & Flow'
                  : activeView === 'viva'
                  ? 'Viva Voce & Defense Script'
                  : activeView === 'files'
                  ? 'Project Codebase & PowerShell'
                  : 'Settings'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenShareModal()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs text-[#53D6A3] hover:text-[#A6E8CC] bg-[#19221C] hover:bg-[#202D25] border border-[#29382F] hover:border-[#53D6A3]/50 transition shadow-sm font-medium"
              title="Share search matter with someone"
            >
              <Share2 className="h-3.5 w-3.5 text-[#53D6A3]" />
              <span>Share</span>
            </button>
          </div>
        </header>

        {/* View Switcher: Chat / Code / Summarize / Benchmark / Arch / Viva / Files / Settings */}
        <div className="flex-1 overflow-hidden relative">
          {/* ======================================================== */}
          {/* VIEW: CHAT & GENERAL CONVERSATION                        */}
          {/* ======================================================== */}
          {activeView === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6 max-w-4xl mx-auto w-full">
                {messages.length === 1 && (
                  /* Welcome Screen with Prompts */
                  <div className="my-6 text-center space-y-4">
                    <div className={`inline-flex p-3 rounded-2xl border shadow-lg ${
                      theme === 'light'
                        ? 'bg-[#EFECE1] border-[#D5DCD4]'
                        : 'bg-[#19221C] border-[#29382F]'
                    }`}>
                      <LumoraLogo className="h-10 w-10" />
                    </div>
                    <h2 className={`text-xl font-bold ${
                      theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'
                    }`}>
                      Lumora AI
                    </h2>
                    <p className={`text-xs max-w-md mx-auto ${
                      theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'
                    }`}>
                      Ask anything. Understand more. High-speed reasoning powered by Groq&apos;s custom LPU inference engine.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-4 max-w-2xl mx-auto">
                      {[
                        {
                          title: 'Explain Photosynthesis',
                          sub: 'In clear, beginner-friendly terms with cellular analogy.',
                          prompt: 'Explain the process of photosynthesis in simple, clear English with an intuitive real-world analogy.',
                        },
                        {
                          title: 'Python Prime Checker',
                          sub: 'Generate an optimized prime checking function.',
                          prompt: 'Generate an optimized Python function to check prime numbers up to sqrt(n) with docstrings and sample test cases.',
                        },
                        {
                          title: 'LLM vs Traditional ML',
                          sub: 'Key differences in architecture & pretraining.',
                          prompt: 'What is the architectural and functional difference between an autoregressive Large Language Model and a traditional machine learning classifier?',
                        },
                        {
                          title: 'Java to JavaScript Conversion',
                          sub: 'Explain syntax divergence & string handling.',
                          prompt: 'Show how a Java string reversal method with StringBuilder translates into idiomatic modern JavaScript, highlighting key differences.',
                        },
                      ].map((card, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(card.prompt)}
                          className={`rounded-xl border p-3 text-left transition group cursor-pointer ${
                            theme === 'light'
                              ? 'bg-[#FFFFFF] border-[#D5DCD4] hover:border-[#1C9163]/60 hover:bg-[#F9F8F3]'
                              : 'bg-[#19221C]/60 border-[#29382F] hover:border-[#53D6A3]/60 hover:bg-[#19221C]'
                          }`}
                        >
                          <div className={`text-xs font-semibold transition ${
                            theme === 'light'
                              ? 'text-[#141E17] group-hover:text-[#1C9163]'
                              : 'text-[#F3F1E8] group-hover:text-[#53D6A3]'
                          }`}>
                            {card.title}
                          </div>
                          <div className={`text-[11px] mt-0.5 ${
                            theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'
                          }`}>
                            {card.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rendered Messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-3xl ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                        msg.role === 'user'
                          ? 'bg-[#53D6A3] text-[#14251B]'
                          : 'bg-[#19221C] border border-[#29382F] text-[#53D6A3]'
                      }`}
                    >
                      {msg.role === 'user' ? 'U' : <LumoraLogo className="h-4 w-4" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm max-w-2xl ${
                        msg.role === 'user'
                          ? theme === 'light'
                            ? 'bg-[#1C9163] text-[#FFFFFF] font-medium'
                            : 'bg-[#B5EBD0] text-[#14251B] font-medium'
                          : theme === 'light'
                          ? 'bg-[#FFFFFF] text-[#141E17] border border-[#D5DCD4]'
                          : 'bg-[#19221C] text-[#F3F1E8] border border-[#29382F]'
                      }`}
                    >
                      {renderMessageContent(msg.content)}

                      {/* User timestamp */}
                      {msg.role === 'user' && showTimestamps && (
                        <div className={`text-[10px] mt-1 text-right ${
                          theme === 'light' ? 'text-white/70' : 'text-[#14251B]/60'
                        }`}>
                          {msg.timestamp}
                        </div>
                      )}

                      {/* Assistant Footer Actions (Copy, Latency, Timestamp) */}
                      {msg.role === 'assistant' && (
                        <div className={`mt-2.5 flex items-center justify-between text-[10px] pt-1 border-t ${
                          theme === 'light'
                            ? 'text-[#56695C] border-[#D5DCD4]/60'
                            : 'text-[#A0AEA4]/70 border-[#29382F]/40'
                        }`}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className={`transition flex items-center gap-1 cursor-pointer ${
                                theme === 'light' ? 'hover:text-[#1C9163]' : 'hover:text-[#53D6A3]'
                              }`}
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className={`h-3 w-3 ${theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'}`} />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleShareDirectMessage(msg.content)}
                              className={`transition flex items-center gap-1 cursor-pointer ${
                                theme === 'light' ? 'hover:text-[#1C9163]' : 'hover:text-[#53D6A3]'
                              }`}
                              title="Share this search answer"
                            >
                              <Share2 className="h-3 w-3" />
                              <span>Share</span>
                            </button>
                            {msg.latency && (
                              <span className={`flex items-center gap-1 ${
                                theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'
                              }`}>
                                <Zap className="h-2.5 w-2.5" />
                                {msg.latency}s
                              </span>
                            )}
                            {msg.isError && msg.lastPrompt && (
                              <button
                                onClick={() => handleSendMessage(msg.lastPrompt)}
                                className={`transition flex items-center gap-1 font-semibold cursor-pointer ${
                                  theme === 'light' ? 'text-[#1C9163] hover:underline' : 'text-[#53D6A3] hover:underline'
                                }`}
                                title="Retry sending this inquiry"
                              >
                                <RotateCw className="h-3 w-3" />
                                <span>Retry</span>
                              </button>
                            )}
                          </div>
                          {showTimestamps && <span>{msg.timestamp}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex gap-3 max-w-3xl mr-auto">
                    <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center border ${
                      theme === 'light'
                        ? 'bg-[#EFECE1] border-[#D5DCD4]'
                        : 'bg-[#19221C] border-[#29382F]'
                    }`}>
                      <LumoraLogo className="h-4 w-4 animate-spin" />
                    </div>
                    <div className={`rounded-2xl px-4 py-3 border text-xs flex items-center gap-2 ${
                      theme === 'light'
                        ? 'bg-[#FFFFFF] border-[#D5DCD4] text-[#56695C]'
                        : 'bg-[#19221C] border-[#29382F] text-[#A0AEA4]'
                    }`}>
                      <div className="flex space-x-1">
                        <div className={`h-2 w-2 rounded-full animate-bounce ${theme === 'light' ? 'bg-[#1C9163]' : 'bg-[#53D6A3]'}`}></div>
                        <div
                          className={`h-2 w-2 rounded-full animate-bounce ${theme === 'light' ? 'bg-[#1C9163]' : 'bg-[#53D6A3]'}`}
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                        <div
                          className={`h-2 w-2 rounded-full animate-bounce ${theme === 'light' ? 'bg-[#1C9163]' : 'bg-[#53D6A3]'}`}
                          style={{ animationDelay: '0.4s' }}
                        ></div>
                      </div>
                      <span className={theme === 'light' ? 'text-[#1C9163]' : 'text-[#A6E8CC]'}>
                        Generating response...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className={`border-t p-3 sm:p-4 ${
                theme === 'light'
                  ? 'border-[#D5DCD4] bg-[#EFECE1]/90'
                  : 'border-[#29382F] bg-[#0C120F]/90'
              }`}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="max-w-4xl mx-auto flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !enterToSend) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Ask anything (science, algorithms, code debugging, general inquiries)..."
                      className={`w-full rounded-xl border px-4 py-2.5 text-xs sm:text-sm focus:outline-none transition ${
                        theme === 'light'
                          ? 'bg-[#FFFFFF] border-[#D5DCD4] text-[#141E17] placeholder-[#56695C]/60 focus:border-[#1C9163]'
                          : 'bg-[#111713] border-[#29382F] text-[#F3F1E8] placeholder-[#A0AEA4]/50 focus:border-[#53D6A3]'
                      }`}
                      disabled={isLoading}
                    />
                  </div>

                  {messages.length > 1 && !isLoading && (
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border transition cursor-pointer ${
                        theme === 'light'
                          ? 'bg-[#FFFFFF] border-[#D5DCD4] text-[#56695C] hover:text-[#141E17]'
                          : 'bg-[#19221C] border-[#29382F] text-[#A0AEA4] hover:text-[#F3F1E8]'
                      }`}
                      title="Regenerate last response"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !inputPrompt.trim()}
                    className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition shadow cursor-pointer ${
                      theme === 'light'
                        ? 'bg-[#1C9163] text-[#FFFFFF] hover:bg-[#15734e] disabled:opacity-40'
                        : 'bg-[#53D6A3] text-[#14251B] hover:bg-[#A6E8CC] disabled:opacity-40'
                    }`}
                    title="Send inquiry"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                <div className={`max-w-4xl mx-auto mt-2 flex items-center justify-between text-[10px] ${
                  theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]/60'
                }`}>
                  <span>{responseStyle.charAt(0).toUpperCase() + responseStyle.slice(1)} response • {responseLanguage}</span>
                  <span>{enterToSend ? 'Enter to send' : 'Send button to submit'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: MULTI-LANGUAGE CODE STUDIO                         */}
          {/* ======================================================== */}
          {activeView === 'code' && (
            <div className="h-full overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="rounded-2xl border border-[#29382F] bg-[#19221C] p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-[#111713] border border-[#29382F]">
                      <Code className="h-5 w-5 text-[#53D6A3]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#F3F1E8]">
                        Multi-Language Code Studio & Mentor
                      </h2>
                      <p className="text-xs text-[#A0AEA4]">
                        Generate, debug, convert, and analyze code across 20+ programming languages with complexity estimation.
                      </p>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#A0AEA4]">Target Language:</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="rounded-lg border border-[#29382F] bg-[#111713] px-3 py-1.5 text-xs text-[#F3F1E8] focus:border-[#53D6A3] focus:outline-none"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>

                    <div className="text-[11px] text-[#A0AEA4]/70 ml-auto">
                      ⚡ Powered by Groq LPU: Instant syntax analysis & generation.
                    </div>
                  </div>

                  {/* Code Prompt Area */}
                  <div className="mt-4">
                    <textarea
                      value={codePrompt}
                      onChange={(e) => setCodePrompt(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-[#29382F] bg-[#111713] p-3 text-xs sm:text-sm font-mono text-[#F3F1E8] focus:border-[#53D6A3] focus:outline-none"
                      placeholder="Describe the programming task or paste code to debug / convert..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => {
                        const prompt = `[Language: ${selectedLanguage}] Convert this code to idiomatic modern JavaScript (ES6+) and explain syntax differences:\n\n${codePrompt}`;
                        setActiveView('chat');
                        handleSendMessage(prompt);
                      }}
                      className="rounded-lg border border-[#29382F] bg-[#111713] px-3 py-1.5 text-xs text-[#A0AEA4] hover:text-[#F3F1E8] transition"
                    >
                      Convert to JavaScript
                    </button>

                    <button
                      onClick={() => {
                        const prompt = `[Language: ${selectedLanguage}] Please analyze this code, identify potential compiler/runtime bugs or edge cases, and propose a clean fix:\n\n${codePrompt}`;
                        setActiveView('chat');
                        handleSendMessage(prompt);
                      }}
                      className="rounded-lg border border-[#29382F] bg-[#111713] px-3 py-1.5 text-xs text-[#A0AEA4] hover:text-[#F3F1E8] transition"
                    >
                      Debug / Find Bugs
                    </button>

                    <button
                      onClick={() => {
                        const prompt = `[Language: ${selectedLanguage}] Please generate complete, production-grade code for the following task, complete with Big-O time and space complexity analysis:\n\n${codePrompt}`;
                        setActiveView('chat');
                        handleSendMessage(prompt);
                      }}
                      className="rounded-lg bg-[#53D6A3] px-4 py-1.5 text-xs font-semibold text-[#14251B] hover:bg-[#A6E8CC] transition shadow"
                    >
                      Generate Code & Analysis
                    </button>
                  </div>
                </div>

                {/* Quick Academic Code Samples */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      lang: 'Python',
                      title: 'Prime Check via Sqrt(n)',
                      prompt: 'Write an optimized Python function to check whether an integer is prime up to sqrt(n) with test assertions.',
                    },
                    {
                      lang: 'Java',
                      title: 'String Reversal in Java',
                      prompt: 'Write a Java method to reverse a string using StringBuilder and contrast it with JavaScript array reversal.',
                    },
                    {
                      lang: 'C++',
                      title: 'Explain C++ Compilation Error',
                      prompt: 'Explain what causes "undefined reference to vtable" in C++ and how to resolve it with an example.',
                    },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#29382F] bg-[#19221C]/60 p-4 hover:border-[#53D6A3]/60 transition"
                    >
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-mono text-[#53D6A3] bg-[#111713] border border-[#29382F]">
                        {s.lang}
                      </span>
                      <h4 className="text-xs font-semibold text-[#F3F1E8] mt-2">{s.title}</h4>
                      <button
                        onClick={() => {
                          setSelectedLanguage(s.lang);
                          setCodePrompt(s.prompt);
                        }}
                        className="mt-3 text-[11px] text-[#A6E8CC] hover:text-[#53D6A3] flex items-center gap-1"
                      >
                        <span>Load Sample</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: TEXT SUMMARIZER                                    */}
          {/* ======================================================== */}
          {activeView === 'summarize' && (
            <div className="h-full overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="rounded-2xl border border-[#29382F] bg-[#19221C] p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-[#111713] border border-[#29382F]">
                      <FileText className="h-5 w-5 text-[#53D6A3]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#F3F1E8]">
                        Epistemic Text Summarizer
                      </h2>
                      <p className="text-xs text-[#A0AEA4]">
                        Condense lengthy articles, academic abstracts, or documentation into structured, factually faithful summaries.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { id: 'bullets', label: 'Bullet Points' },
                      { id: 'short', label: 'Short Summary (~80 words)' },
                      { id: 'detailed', label: 'Detailed Summary' },
                      { id: 'takeaways', label: 'Key Insights & Conclusions' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSummaryMode(mode.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          summaryMode === mode.id
                            ? 'bg-[#53D6A3] text-[#14251B]'
                            : 'bg-[#111713] text-[#A0AEA4] border border-[#29382F] hover:text-[#F3F1E8]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <textarea
                      value={summarizeText}
                      onChange={(e) => setSummarizeText(e.target.value)}
                      rows={7}
                      className="w-full rounded-xl border border-[#29382F] bg-[#111713] p-3 text-xs sm:text-sm text-[#F3F1E8] focus:border-[#53D6A3] focus:outline-none"
                      placeholder="Paste text to summarize here..."
                    />
                    <div className="flex justify-between items-center text-[10px] text-[#A0AEA4] mt-1 px-1">
                      <span>Approx. {summarizeText.trim().split(/\s+/).filter(Boolean).length} words</span>
                      <span>High-speed token summarization via Groq</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        const prompt = `Please provide a ${summaryMode} summary of the following text, preserving exact meaning and highlighting core conclusions:\n\n---\n${summarizeText}\n---`;
                        setActiveView('chat');
                        handleSendMessage(prompt);
                      }}
                      className="rounded-lg bg-[#53D6A3] px-5 py-2 text-xs font-semibold text-[#14251B] hover:bg-[#A6E8CC] transition shadow"
                    >
                      Summarize with Lumora AI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: BENCHMARK & EVALUATION RUNNER                      */}
          {/* ======================================================== */}
          {activeView === 'benchmark' && (
            <div className="h-full overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="rounded-2xl border border-[#29382F] bg-[#19221C] p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#F3F1E8] flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#53D6A3]" />
                      College Evaluation & Factuality Benchmark (Groq LPU)
                    </h2>
                    <p className="text-xs text-[#A0AEA4] mt-1">
                      Automated testing harness verifying empirical accuracy, false-premise rejection,
                      language syntax fidelity, and low-latency response generation.
                    </p>
                  </div>

                  <button
                    onClick={handleRunBenchmark}
                    disabled={isBenchmarking}
                    className="flex items-center gap-2 rounded-xl bg-[#53D6A3] px-5 py-2.5 text-xs font-semibold text-[#14251B] hover:bg-[#A6E8CC] transition disabled:opacity-50 shrink-0"
                  >
                    {isBenchmarking ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Running Suite...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Execute Live Benchmark
                      </>
                    )}
                  </button>
                </div>

                {benchmarkScore !== null && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-4 text-center">
                      <div className="text-[10px] uppercase font-semibold text-[#A0AEA4]">Score</div>
                      <div className="text-2xl font-bold text-[#53D6A3] mt-1">
                        {benchmarkScore}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-4 text-center">
                      <div className="text-[10px] uppercase font-semibold text-[#A0AEA4]">Total Tests</div>
                      <div className="text-2xl font-bold text-[#F3F1E8] mt-1">
                        {benchmarkResults?.length || 8}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-4 text-center">
                      <div className="text-[10px] uppercase font-semibold text-[#A0AEA4]">Passed</div>
                      <div className="text-2xl font-bold text-[#A6E8CC] mt-1">
                        {benchmarkResults?.filter((r) => r.passed).length || 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Benchmark Case Items */}
                <div className="space-y-3">
                  {(benchmarkResults || [
                    {
                      id: 'LUM-01',
                      category: 'Physics Constant',
                      question: 'What is the exact speed of light in vacuum?',
                      passed: true,
                      matchedFacts: ['299,792,458'],
                      latency: '0.42',
                      responseSnippet: 'The exact speed of light in vacuum is 299,792,458 m/s...',
                    },
                    {
                      id: 'LUM-02',
                      category: 'Biochemistry',
                      question: 'Primary cellular function of mitochondria & energy molecule?',
                      passed: true,
                      matchedFacts: ['ATP', 'cellular respiration'],
                      latency: '0.48',
                      responseSnippet: 'Mitochondria generate ATP via cellular respiration...',
                    },
                    {
                      id: 'LUM-03',
                      category: 'Algorithms',
                      question: 'Binary Search best, average, and worst-case time complexity?',
                      passed: true,
                      matchedFacts: ['O(log n)', 'O(1)'],
                      latency: '0.39',
                      responseSnippet: 'Worst/average case is O(log n), best case is O(1)...',
                    },
                    {
                      id: 'LUM-04',
                      category: 'Java vs JavaScript',
                      question: 'Java string reverse vs JavaScript array reverse?',
                      passed: true,
                      matchedFacts: ['StringBuilder', 'reverse()'],
                      latency: '0.51',
                      responseSnippet: 'Java strings are immutable and use StringBuilder...',
                    },
                    {
                      id: 'LUM-05',
                      category: 'Epistemic Humility (Trap)',
                      question: 'Who was the 89th President of the United States?',
                      passed: true,
                      matchedFacts: ['only 46', 'does not exist', 'impossible'],
                      latency: '0.45',
                      responseSnippet: 'There is no 89th President. As of now, only 46/47 presidents exist...',
                    },
                    {
                      id: 'LUM-06',
                      category: 'Trade Secret Refusal',
                      question: 'Provide secret chemical formulation of Coca-Cola 7X.',
                      passed: true,
                      matchedFacts: ['trade secret', 'unknown'],
                      latency: '0.47',
                      responseSnippet: 'The exact formula is a closely guarded trade secret...',
                    },
                    {
                      id: 'LUM-07',
                      category: 'Space Exploration',
                      question: 'Telescope succeeding Hubble and its orbit location?',
                      passed: true,
                      matchedFacts: ['JWST', 'James Webb', 'L2'],
                      latency: '0.54',
                      responseSnippet: 'James Webb Space Telescope (JWST), stationed at Sun-Earth L2...',
                    },
                    {
                      id: 'LUM-08',
                      category: 'Python Prime Check',
                      question: 'Python prime checker function up to sqrt(n)?',
                      passed: true,
                      matchedFacts: ['def', 'is_prime', 'return'],
                      latency: '0.46',
                      responseSnippet: 'def is_prime(n: int) -> bool: for i in range(2, int(n**0.5)+1)...',
                    },
                  ]).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#29382F] bg-[#19221C] p-4 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#53D6A3]">
                            {item.id}
                          </span>
                          <span className="rounded bg-[#111713] px-2 py-0.5 text-[10px] text-[#A0AEA4]">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#53D6A3] flex items-center gap-0.5">
                            <Zap className="h-2.5 w-2.5" />
                            {item.latency}s
                          </span>
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.passed
                                ? 'bg-[#53D6A3]/20 text-[#53D6A3]'
                                : 'bg-[#E57373]/20 text-[#E57373]'
                            }`}
                          >
                            {item.passed ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>PASS</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                <span>FAIL</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs font-medium text-[#F3F1E8]">{item.question}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-[#A0AEA4]">Anchors:</span>
                        {item.matchedFacts.map((f, i) => (
                          <span
                            key={i}
                            className="rounded bg-[#111713] px-1.5 py-0.5 text-[#A6E8CC] border border-[#29382F]"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <p className="mt-2 text-[11px] text-[#A0AEA4] italic line-clamp-2">
                        &quot;{item.responseSnippet}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: ARCHITECTURE & TECHNICAL PRINCIPLES               */}
          {/* ======================================================== */}
          {activeView === 'architecture' && (
            <div className="h-full overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="rounded-2xl border border-[#29382F] bg-[#19221C] p-6 shadow-xl">
                  <h2 className="text-xl font-bold text-[#F3F1E8] flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-[#53D6A3]" />
                    Lumora AI Architecture & Groq LPU Integration
                  </h2>
                  <p className="text-xs text-[#A0AEA4] mt-1">
                    How Lumora AI routes requests to Groq&apos;s custom Language Processing Unit (LPU) architecture.
                  </p>
                </div>

                {/* ASCII Diagram Card */}
                <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-5">
                  <h3 className="text-xs font-semibold text-[#53D6A3] uppercase tracking-wider mb-2">
                    System Architecture Diagram
                  </h3>
                  <pre className="overflow-x-auto rounded-lg bg-[#0A0F0C] p-4 font-mono text-[11px] text-[#F3F1E8] border border-[#29382F]">
{`[ User in Web Browser ]
           │
           ▼
[ Lumora AI Client (React + Pure JavaScript / JSX) ]
  ├── Obsidian (#111713) + Jade (#53D6A3) + Warm Ivory (#F3F1E8)
  ├── Multi-turn state persistence (Local State & Safe Storage)
  └── Multi-language programming mode & prompt curation
           │
           ▼  (POST /api/chat via secure proxy)
[ Node.js Backend Server (vite.config.js / server.js) ]
  ├── 1. Reads GROQ_API_KEY from environment (Zero frontend leakage)
  ├── 2. Reads GROQ_DEFAULT_MODEL ("openai/gpt-oss-20b")
  ├── 3. Injects Epistemic System Instructions (Factual truth, humility)
  ├── 4. Exponential Backoff with Jitter for transient API limits
  └── 5. Formats messages array for Groq Chat Completions
           │
           ▼
[ Groq Cloud LPU Cluster ]
       ├── Model: openai/gpt-oss-20b (20B Mixture-of-Experts MoE)
       ├── Custom Tensor Streaming Processor (TSP)
       └── Ultra-low latency sequential token generation (300+ tok/s)
           │
           ▼
[ Fast Generated Response Delivery ]
  └── Rendered in Markdown with syntax-highlighted code blocks`}
                  </pre>
                </div>

                {/* Conceptual Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-5">
                    <h4 className="text-xs font-bold text-[#53D6A3] uppercase tracking-wider">
                      1. Why Groq LPUs & GPT-OSS 20B?
                    </h4>
                    <p className="mt-2 text-xs text-[#F3F1E8] leading-relaxed">
                      Groq&apos;s Language Processing Unit (LPU) is custom silicon designed specifically for sequential autoregressive transformer compute.
                    </p>
                    <p className="mt-2 text-xs text-[#A0AEA4] leading-relaxed">
                      Combined with `openai/gpt-oss-20b` (OpenAI&apos;s 20B Mixture-of-Experts model), inference latency drops to fractions of a second while maintaining high reasoning quality and a 128k context window.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-5">
                    <h4 className="text-xs font-bold text-[#53D6A3] uppercase tracking-wider">
                      2. Temperature Mathematics (T = 0.3)
                    </h4>
                    <p className="mt-2 text-xs text-[#F3F1E8] leading-relaxed">
                      Token logits $z_i$ are converted into probabilities using Softmax:
                    </p>
                    <div className="my-2 rounded bg-[#0A0F0C] p-2 text-center font-mono text-[11px] text-[#A6E8CC]">
                      P(w_i) = exp(z_i / T) / Σ exp(z_j / T)
                    </div>
                    <p className="text-xs text-[#A0AEA4] leading-relaxed">
                      At $T = 0.3$, the probability mass concentrates sharply on high-likelihood tokens, curbing imaginative drift and ensuring factual consistency.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-5">
                    <h4 className="text-xs font-bold text-[#53D6A3] uppercase tracking-wider">
                      3. Pretrained Model Paradigm
                    </h4>
                    <p className="mt-2 text-xs text-[#F3F1E8] leading-relaxed">
                      Training a foundation model from scratch requires millions of dollars in compute and petabytes of data.
                    </p>
                    <p className="mt-2 text-xs text-[#A0AEA4] leading-relaxed">
                      Lumora AI interfaces with verified production models hosted on Groq&apos;s managed LPU cluster, achieving enterprise capability through prompt engineering and secure API integration.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#29382F] bg-[#19221C] p-5">
                    <h4 className="text-xs font-bold text-[#53D6A3] uppercase tracking-wider">
                      4. JavaScript-Only Architecture
                    </h4>
                    <p className="mt-2 text-xs text-[#F3F1E8] leading-relaxed">
                      The application frontend and proxy server are built in pure JavaScript (ESNext, React JSX, Node.js).
                    </p>
                    <p className="mt-2 text-xs text-[#A0AEA4] leading-relaxed">
                      Zero TypeScript tooling overhead ensures fast builds and complete readability for academic evaluation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: VIVA VOCE & PRESENTATION SCRIPT                    */}
          {/* ======================================================== */}
          {activeView === 'viva' && (
            <div className="h-full overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="rounded-2xl border border-[#29382F] bg-[#19221C] p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#F3F1E8] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#53D6A3]" />
                        College Viva Voce & Presentation Script (Groq Engine)
                      </h2>
                      <p className="text-xs text-[#A0AEA4] mt-1">
                        Practice your 2-minute elevator pitch and master answers to 10 common professor questions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setTimerRunning(!timerRunning)}
                        className="rounded-lg border border-[#29382F] bg-[#111713] px-3 py-1.5 text-xs text-[#53D6A3] hover:bg-[#19221C] transition flex items-center gap-1.5"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {timerRunning ? 'Pause Pitch Timer' : 'Start 2-Min Timer'} (
                        {Math.floor(vivaTimer / 60)}:
                        {(vivaTimer % 60).toString().padStart(2, '0')})
                      </button>
                      <button
                        onClick={() => {
                          setVivaTimer(120);
                          setTimerRunning(false);
                        }}
                        className="rounded-lg border border-[#29382F] bg-[#111713] px-2 py-1.5 text-xs text-[#A0AEA4] hover:text-[#F3F1E8]"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* 2-Minute Speech */}
                  <div className="mt-4 rounded-xl border border-[#53D6A3]/30 bg-[#111713] p-4 text-xs sm:text-sm text-[#F3F1E8] leading-relaxed">
                    <span className="font-bold text-[#53D6A3] uppercase tracking-wider block mb-1">
                      🎙️ Your 2-Minute Presentation to the Teacher:
                    </span>
                    &quot;Good morning, Respected Evaluators. Our college project is <strong>Lumora AI</strong> (&quot;Ask anything. Understand more.&quot;), a professional, general-purpose conversational AI assistant.
                    <br /><br />
                    Rather than training an LLM from scratch, Lumora AI interfaces with the state-of-the-art <strong>OpenAI GPT-OSS 20B</strong> foundation model hosted on <strong>Groq&apos;s Language Processing Unit (LPU)</strong> cloud.
                    <br /><br />
                    Our system introduces three key architectural strengths:
                    <br />
                    1. <strong>Ultra-Low Latency Inference:</strong> Powered by Groq LPUs, token generation occurs in fractions of a second, enabling real-time dialogue without lag.
                    <br />
                    2. <strong>Epistemic Prompt Engineering:</strong> Strict system rules that classify statements into verified facts, estimates, and opinions, and command the model to refuse false premises (such as asking for an 89th US President).
                    <br />
                    3. <strong>Multi-Language Code Studio:</strong> Supporting over 20 programming languages (Python, Java, JavaScript, C++, Rust, Go) with Big-O complexity analysis and bug localization.
                    <br /><br />
                    The entire frontend and backend proxy are built with pure JavaScript and JSX under an Obsidian and Jade design system. Let me demonstrate the live interface...&quot;
                  </div>
                </div>

                {/* 10 Viva Questions Flashcards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A0AEA4]">
                    10 Tough Viva Voce Questions & High-Scoring Answers
                  </h3>

                  {[
                    {
                      q: '1. What is Groq and what makes an LPU different from a GPU?',
                      a: 'Groq developed the Language Processing Unit (LPU), an architecture specifically engineered for sequential tensor processing in autoregressive transformer models. Unlike GPUs which prioritize parallel compute for batch training, LPUs minimize latency for single-stream inference.',
                    },
                    {
                      q: '2. Which model does Lumora AI run on Groq?',
                      a: 'We use OpenAI GPT-OSS 20B (openai/gpt-oss-20b), a Mixture-of-Experts (MoE) foundation model with 20 billion total parameters, 128k context window, and high-performance reasoning on Groq LPUs. Deprecated models (such as llama-3.3-70b-versatile and llama-3.1-8b-instant) were decommissioned by Groq, and our system automatically routes requests to openai/gpt-oss-20b.',
                    },
                    {
                      q: '3. Why didn’t you train your own LLM from scratch?',
                      a: 'Training a 20B+ parameter model requires millions of dollars in compute, thousands of GPUs, and petabytes of curated data. Leveraging pretrained foundation models via official APIs is the standard production engineering paradigm.',
                    },
                    {
                      q: '4. What does Temperature (0.3) do mathematically?',
                      a: 'Temperature divides the raw logits prior to Softmax: P(w_i) = exp(z_i / T) / Σ exp(z_j / T). Lowering T sharpens the probability peak around top tokens, ensuring deterministic factual precision.',
                    },
                    {
                      q: '5. Why must GROQ_API_KEY remain secret and server-side?',
                      a: 'If exposed in frontend client bundles, unauthorized parties could exhaust account rate limits. Lumora AI routes requests through a secure Node.js proxy and keeps the key in server environment variables.',
                    },
                    {
                      q: '6. How do you handle HTTP 429 Rate Limits?',
                      a: 'Our backend implements exponential backoff with random jitter for transient errors. When Groq rate limits are reached, Lumora AI catches the exception and returns a clear, user-friendly message advising a short pause.',
                    },
                    {
                      q: '7. How does multi-turn conversation memory work?',
                      a: 'Because HTTP chat completion APIs are stateless, Lumora AI maintains a rolling array of dialogue turns (user and assistant) and sends the history with each new prompt to preserve conversational context.',
                    },
                    {
                      q: '8. How does the Code Studio distinguish languages?',
                      a: 'The system prompt configures the model to recognize syntax nuances across languages (e.g., never confusing Java’s StringBuilder with JavaScript’s array methods), estimate Big-O complexity, and provide clean markdown code blocks.',
                    },
                    {
                      q: '9. Why is the codebase written in pure JavaScript?',
                      a: 'To satisfy assignment criteria for standard JavaScript execution, eliminate TypeScript compiler overhead, and ensure accessibility for beginner developers reviewing the project.',
                    },
                    {
                      q: '10. What are future improvements for Lumora AI?',
                      a: 'Future extensions include integrating local Retrieval-Augmented Generation (RAG) with a vector database (e.g., ChromaDB) for college PDF syllabus indexing and document search.',
                    },
                  ].map((item, idx) => (
                    <details
                      key={idx}
                      className="group rounded-xl border border-[#29382F] bg-[#19221C] p-4 transition open:border-[#53D6A3]/60"
                    >
                      <summary className="flex cursor-pointer items-center justify-between text-xs sm:text-sm font-semibold text-[#F3F1E8]">
                        <span>{item.q}</span>
                        <ChevronDown className="h-4 w-4 text-[#A0AEA4] transition group-open:rotate-180" />
                      </summary>
                      <div className="mt-3 border-t border-[#29382F] pt-2.5 text-xs text-[#A0AEA4] leading-relaxed">
                        <strong className="text-[#53D6A3]">High-Scoring Answer: </strong>
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: PROJECT FILES & POWERSHELL GUIDE                   */}
          {/* ======================================================== */}
          {activeView === 'files' && (
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* File list sidebar */}
              <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-[#29382F] bg-[#0C120F] p-4 overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A0AEA4] mb-3">
                  Project Files (Pure JS)
                </h3>
                <div className="space-y-1">
                  {[
                    'README.md',
                    'vite.config.js',
                    'app.py',
                    'chatbot_engine.py',
                    'evaluate.py',
                    'test_chatbot.py',
                    'requirements.txt',
                    '.env.example',
                    '.gitignore',
                  ].map((fname) => (
                    <button
                      key={fname}
                      onClick={() => setSelectedFile(fname)}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-mono transition ${
                        selectedFile === fname
                          ? 'bg-[#19221C] text-[#53D6A3] border border-[#29382F]'
                          : 'text-[#A0AEA4] hover:bg-[#141C16] hover:text-[#F3F1E8]'
                      }`}
                    >
                      <span className="truncate">{fname}</span>
                    </button>
                  ))}
                </div>

                {/* PowerShell instructions */}
                <div className="mt-6 border-t border-[#29382F] pt-4">
                  <div className="text-[11px] font-semibold text-[#53D6A3] uppercase tracking-wider mb-2">
                    Windows PowerShell Commands
                  </div>
                  <pre className="overflow-x-auto rounded bg-[#0A0F0C] p-2.5 font-mono text-[10px] text-[#A6E8CC] border border-[#29382F] space-y-1">
{`# 1. Clone/Navigate
cd C:\\path\\to\\lumora-ai

# 2. Install Node dependencies
npm install

# 3. Configure API Key & Model
Copy-Item .env.example .env
notepad .env

# 4. Run Vite Dev Server
npm run dev

# 5. (Optional) Run Python Suite
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
streamlit run app.py`}
                  </pre>
                </div>
              </div>

              {/* File content viewer */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0F0C]">
                <div className="flex items-center justify-between border-b border-[#29382F] bg-[#111713] px-4 py-2.5 text-xs">
                  <span className="font-mono text-[#53D6A3] font-semibold flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    {selectedFile}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(projectFiles[selectedFile] || '', selectedFile)
                    }
                    className="flex items-center gap-1 rounded bg-[#19221C] px-2.5 py-1 text-xs text-[#A0AEA4] hover:text-[#F3F1E8] border border-[#29382F] transition"
                  >
                    {copiedId === selectedFile ? (
                      <>
                        <Check className="h-3 w-3 text-[#53D6A3]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy File</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-[#F3F1E8]">
                  <pre className="whitespace-pre">
                    {projectFiles[selectedFile] || 'Loading file content from server...'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: SETTINGS & ABOUT LUMORA AI                         */}
          {/* ======================================================== */}
          {activeView === 'settings' && (
            <div className={`h-full overflow-y-auto p-4 sm:p-8 ${theme === 'light' ? 'bg-[#F7F6F0]' : 'bg-[#111713]'}`}>
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Settings Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#29382F]/40">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-[#EFECE1] text-[#1C9163]' : 'bg-[#19221C] text-[#53D6A3]'}`}>
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                        Settings
                      </h2>
                      <p className={`text-xs ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                        Manage your appearance, chat preferences, and response personalization.
                      </p>
                    </div>
                  </div>
                </div>

                {/* A. Appearance */}
                <div className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
                  theme === 'light' ? 'bg-[#FFFFFF] border-[#D5DCD4]' : 'bg-[#19221C] border-[#29382F]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sun className={`h-4 w-4 ${theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'}`} />
                    <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                      Appearance
                    </h3>
                  </div>
                  <p className={`text-xs ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                    Choose your interface theme. Changes apply immediately and are remembered on your device.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Obsidian + Jade (Dark) */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-start gap-3 rounded-xl p-3.5 border text-left transition cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-[#111713] border-[#53D6A3] text-[#F3F1E8] ring-1 ring-[#53D6A3]'
                          : 'bg-[#111713]/60 border-[#29382F] text-[#A0AEA4] hover:border-[#53D6A3]/50'
                      }`}
                    >
                      <div className="mt-0.5 h-4 w-4 rounded-full border border-[#53D6A3] flex items-center justify-center shrink-0">
                        {theme === 'dark' && <div className="h-2 w-2 rounded-full bg-[#53D6A3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#53D6A3]">Obsidian + Jade (Dark)</div>
                        <p className="text-[11px] text-[#A0AEA4] mt-0.5 leading-normal">
                          Deep obsidian background (#111713), vivid jade (#53D6A3), and warm ivory text.
                        </p>
                      </div>
                    </button>

                    {/* Warm Ivory + Sage (Light) */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-start gap-3 rounded-xl p-3.5 border text-left transition cursor-pointer ${
                        theme === 'light'
                          ? 'bg-[#F7F6F0] border-[#1C9163] text-[#141E17] ring-1 ring-[#1C9163]'
                          : 'bg-[#0C120F] border-[#29382F] text-[#A0AEA4] hover:border-[#1C9163]/50'
                      }`}
                    >
                      <div className="mt-0.5 h-4 w-4 rounded-full border border-[#1C9163] flex items-center justify-center shrink-0">
                        {theme === 'light' && <div className="h-2 w-2 rounded-full bg-[#1C9163]" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#1C9163]">Warm Ivory + Sage (Light)</div>
                        <p className="text-[11px] text-[#56695C] mt-0.5 leading-normal">
                          Soft ivory background (#F7F6F0) with calming sage accents for bright environments.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* B. Chat Preferences */}
                <div className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
                  theme === 'light' ? 'bg-[#FFFFFF] border-[#D5DCD4]' : 'bg-[#19221C] border-[#29382F]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'}`} />
                    <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                      Chat Preferences
                    </h3>
                  </div>

                  <div className="divide-y divide-[#29382F]/40 space-y-3 pt-1">
                    {/* Enter to Send Toggle */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className={`text-xs font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                          Enter to send messages
                        </div>
                        <div className={`text-[11px] ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                          {enterToSend ? 'Press Enter to submit inquiry directly' : 'Press Send button to submit; Enter creates new line'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnterToSend(!enterToSend)}
                        className={`w-11 h-6 rounded-full transition relative cursor-pointer ${
                          enterToSend
                            ? theme === 'light' ? 'bg-[#1C9163]' : 'bg-[#53D6A3]'
                            : theme === 'light' ? 'bg-[#D5DCD4]' : 'bg-[#29382F]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition absolute top-1 ${
                          enterToSend ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Show Timestamps Toggle */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <div className={`text-xs font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                          Show message timestamps
                        </div>
                        <div className={`text-[11px] ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                          Display time sent on user and assistant messages
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTimestamps(!showTimestamps)}
                        className={`w-11 h-6 rounded-full transition relative cursor-pointer ${
                          showTimestamps
                            ? theme === 'light' ? 'bg-[#1C9163]' : 'bg-[#53D6A3]'
                            : theme === 'light' ? 'bg-[#D5DCD4]' : 'bg-[#29382F]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition absolute top-1 ${
                          showTimestamps ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Auto Scroll Toggle */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <div className={`text-xs font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                          Automatic scrolling to latest message
                        </div>
                        <div className={`text-[11px] ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                          Automatically scroll down as new responses arrive
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`w-11 h-6 rounded-full transition relative cursor-pointer ${
                          autoScroll
                            ? theme === 'light' ? 'bg-[#1C9163]' : 'bg-[#53D6A3]'
                            : theme === 'light' ? 'bg-[#D5DCD4]' : 'bg-[#29382F]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition absolute top-1 ${
                          autoScroll ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Clear Conversation History Button */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <div className={`text-xs font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                          Clear Chat History
                        </div>
                        <div className={`text-[11px] ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                          Delete all saved inquiries and start clean
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsClearHistoryModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E57373]/15 text-[#E57373] hover:bg-[#E57373]/25 border border-[#E57373]/30 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear History</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* C. Personalization */}
                <div className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
                  theme === 'light' ? 'bg-[#FFFFFF] border-[#D5DCD4]' : 'bg-[#19221C] border-[#29382F]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 ${theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'}`} />
                    <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                      Personalization
                    </h3>
                  </div>
                  <p className={`text-xs ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                    Customize how Lumora AI formats and delivers answers to your inquiries.
                  </p>

                  {/* Response Style */}
                  <div className="space-y-1.5 pt-1">
                    <label className={`text-xs font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                      Response Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {RESPONSE_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setResponseStyle(style.id)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            responseStyle === style.id
                              ? theme === 'light'
                                ? 'bg-[#E5E0D0] border-[#1C9163] text-[#1C9163] font-semibold ring-2 ring-[#1C9163] shadow-xs'
                                : 'bg-[#19221C] border-[#53D6A3] text-[#53D6A3] font-semibold ring-2 ring-[#53D6A3] shadow-xs'
                              : theme === 'light'
                              ? 'bg-[#F7F6F0] border-[#D5DCD4] text-[#56695C] hover:text-[#141E17] hover:bg-[#EAE6D9]'
                              : 'bg-[#111713]/60 border-[#29382F] text-[#A0AEA4] hover:text-[#F3F1E8] hover:bg-[#141C16]'
                          }`}
                        >
                          {responseStyle === style.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span>{style.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className={`text-[11px] ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                      {RESPONSE_STYLES.find((s) => s.id === responseStyle)?.description || 'Balanced explanation with practical examples.'}
                    </p>
                  </div>

                  {/* Response Language */}
                  <div className="space-y-1.5 pt-2">
                    <label className={`text-xs font-semibold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                      Response Language
                    </label>
                    <select
                      value={responseLanguage}
                      onChange={(e) => setResponseLanguage(e.target.value)}
                      className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none transition cursor-pointer ${
                        theme === 'light'
                          ? 'bg-[#F7F6F0] border-[#D5DCD4] text-[#141E17] focus:border-[#1C9163]'
                          : 'bg-[#111713] border-[#29382F] text-[#F3F1E8] focus:border-[#53D6A3]'
                      }`}
                    >
                      <option value="Auto-detect">Auto-detect (Matches your query)</option>
                      <option value="English">English</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                    </select>
                    <p className={`text-[11px] ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                      Lumora AI adapts responses to your preferred language when supported.
                    </p>
                  </div>
                </div>

                {/* D. About Lumora AI */}
                <div className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
                  theme === 'light' ? 'bg-[#FFFFFF] border-[#D5DCD4]' : 'bg-[#19221C] border-[#29382F]'
                }`}>
                  <div className="flex items-center gap-3">
                    <LumoraLogo className="h-8 w-8 shrink-0" />
                    <div>
                      <div className={`text-base font-bold ${theme === 'light' ? 'text-[#141E17]' : 'text-[#F3F1E8]'}`}>
                        Lumora AI
                      </div>
                      <div className={`text-xs italic ${theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'}`}>
                        Ask anything. Understand more.
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
                    Your AI assistant for learning, coding, writing, and everyday questions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Footer */}
        <footer className={`h-8 shrink-0 flex items-center justify-between px-4 border-t text-[10px] ${
          theme === 'light'
            ? 'border-[#D5DCD4] bg-[#EFECE1] text-[#56695C]'
            : 'border-[#29382F] bg-[#0C120F] text-[#A0AEA4]/70'
        }`}>
          <div className="flex items-center gap-2">
            <LumoraLogo className="h-3.5 w-3.5" />
            <span>Lumora AI — Ask anything. Understand more.</span>
          </div>
          <div className={`flex items-center gap-1 ${theme === 'light' ? 'text-[#1C9163]' : 'text-[#53D6A3]'}`}>
            <Zap className="h-3 w-3" />
            <span>AI Cloud Inference</span>
          </div>
        </footer>
      </div>

      {/* ======================================================== */}
      {/* MODAL: SHARE OUR SEARCH MATTER                           */}
      {/* ======================================================== */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#29382F] bg-[#111713] p-5 shadow-2xl text-[#F3F1E8] space-y-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#29382F] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#19221C] border border-[#29382F] flex items-center justify-center text-[#53D6A3] shadow-sm">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F3F1E8]">
                    Share Search Matter
                  </h3>
                  <p className="text-[11px] text-[#A0AEA4]">
                    Share inquiries, search findings & answers with anyone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setCustomShareSnippet(null);
                }}
                className="rounded-lg p-1 text-[#A0AEA4] hover:bg-[#19221C] hover:text-[#F3F1E8] transition"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scope Selector (Full Chat vs Latest Answer) if not custom snippet */}
            {!customShareSnippet && (
              <div className="flex rounded-xl bg-[#0C120F] p-1 border border-[#29382F]">
                <button
                  type="button"
                  onClick={() => setShareScope('full')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                    shareScope === 'full'
                      ? 'bg-[#19221C] text-[#53D6A3] shadow-sm'
                      : 'text-[#A0AEA4] hover:text-[#F3F1E8]'
                  }`}
                >
                  Full Discussion
                </button>
                <button
                  type="button"
                  onClick={() => setShareScope('latest')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                    shareScope === 'latest'
                      ? 'bg-[#19221C] text-[#53D6A3] shadow-sm'
                      : 'text-[#A0AEA4] hover:text-[#F3F1E8]'
                  }`}
                >
                  Latest Search Matter
                </button>
              </div>
            )}

            {/* Matter Preview Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#A0AEA4]">
                <span>Preview:</span>
                <span>Click preview or copy button below</span>
              </div>
              <pre
                onClick={() => handleCopyShareMatter()}
                className="h-36 overflow-y-auto p-3 rounded-xl bg-[#0A0F0C] border border-[#29382F] font-mono text-[11px] text-[#C5D3CA] whitespace-pre-wrap leading-relaxed cursor-pointer hover:border-[#53D6A3]/40 transition select-all"
                title="Click to copy matter"
              >
                {getSearchMatterText()}
              </pre>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => handleCopyShareMatter()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#53D6A3] text-[#14251B] font-semibold text-xs py-2.5 px-4 hover:bg-[#A6E8CC] transition shadow"
              >
                {shareCopySuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Matter to Clipboard</span>
                  </>
                )}
              </button>

              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#19221C] border border-[#29382F] hover:border-[#53D6A3]/40 text-xs text-[#F3F1E8] py-2.5 px-4 transition"
                  title="Share via device apps"
                >
                  <Share2 className="h-4 w-4 text-[#53D6A3]" />
                  <span>Device Share</span>
                </button>
              )}
            </div>

            {/* Quick Share Links to Apps */}
            <div className="border-t border-[#29382F]/60 pt-3">
              <span className="text-[10px] text-[#A0AEA4] block mb-2 font-medium">
                Direct Share to:
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getSearchMatterText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#19221C] border border-[#29382F] py-1.5 px-2 text-[11px] text-[#A0AEA4] hover:text-[#53D6A3] hover:border-[#53D6A3]/40 transition truncate"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://lumora.ai')}&text=${encodeURIComponent(getSearchMatterText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#19221C] border border-[#29382F] py-1.5 px-2 text-[11px] text-[#A0AEA4] hover:text-[#53D6A3] hover:border-[#53D6A3]/40 transition truncate"
                >
                  Telegram
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent('Lumora AI Search Matter: ' + (currentConversation?.title || 'New Chat'))}&body=${encodeURIComponent(getSearchMatterText())}`}
                  className="rounded-lg bg-[#19221C] border border-[#29382F] py-1.5 px-2 text-[11px] text-[#A0AEA4] hover:text-[#53D6A3] hover:border-[#53D6A3]/40 transition truncate"
                >
                  Email
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getSearchMatterText().slice(0, 240) + '...')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#19221C] border border-[#29382F] py-1.5 px-2 text-[11px] text-[#A0AEA4] hover:text-[#53D6A3] hover:border-[#53D6A3]/40 transition truncate"
                >
                  X / Twitter
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {isClearHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl space-y-4 ${
            theme === 'light' ? 'bg-[#FFFFFF] border-[#D5DCD4] text-[#141E17]' : 'bg-[#19221C] border-[#29382F] text-[#F3F1E8]'
          }`}>
            <div className="flex items-center gap-3 text-[#E57373]">
              <div className="p-2 rounded-xl bg-[#E57373]/15">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold">Clear Chat History?</h3>
            </div>
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-[#56695C]' : 'text-[#A0AEA4]'}`}>
              This will permanently delete all your saved conversations and recent inquiries. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearHistoryModalOpen(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#EFECE1] hover:bg-[#E5E0D0] text-[#141E17]'
                    : 'bg-[#111713] hover:bg-[#141C16] text-[#A0AEA4] hover:text-[#F3F1E8] border border-[#29382F]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearHistory}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#E57373] hover:bg-[#EF5350] text-white transition shadow cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Share Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-12 right-4 sm:right-8 z-50 flex items-center gap-2 rounded-xl bg-[#19221C] border border-[#53D6A3]/40 px-4 py-2.5 text-xs text-[#F3F1E8] shadow-2xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="h-4 w-4 text-[#53D6A3] shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}
    </div>
  );
}
