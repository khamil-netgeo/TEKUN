import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Bot, User, Loader2, ChevronDown,
  Sparkles, RotateCcw
} from 'lucide-react';

/* ─── Types ─── */
interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface ChatHistory {
  role: 'user' | 'model';
  content: string;
}

/* ─── Suggested questions ─── */
const SUGGESTIONS = {
  bm: [
    'Apakah skim pembiayaan yang tersedia?',
    'Berapa jumlah maksimum yang boleh dipohon?',
    'Apakah dokumen yang diperlukan?',
    'Bagaimana cara untuk mohon?',
    'Saya usahawan wanita, skim mana sesuai?',
    'Berapa lama proses kelulusan?',
  ],
  en: [
    'What financing schemes are available?',
    'What is the maximum amount I can apply for?',
    'What documents are required?',
    'How do I apply for financing?',
    'I am a woman entrepreneur, which scheme suits me?',
    'How long does the approval process take?',
  ],
};

/* ─── API ─── */
const API_BASE = 'http://34.177.95.116:8000/api';

async function sendMessage(message: string, history: ChatHistory[]): Promise<string> {
  const res = await fetch(`${API_BASE}/chatbot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.reply;
}

/* ─── Markdown-lite renderer ─── */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<p class="font-bold text-slate-800 mt-2 mb-1">$1</p>')
    .replace(/^## (.*$)/gm, '<p class="font-bold text-slate-900 mt-3 mb-1 text-sm">$1</p>')
    .replace(/^- (.*$)/gm, '<li class="ml-3 list-disc">$1</li>')
    .replace(/^\d+\.\s+(.*$)/gm, '<li class="ml-3 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

/* ─── Component ─── */
export default function ChatbotWidget({ lang = 'bm' }: { lang?: 'bm' | 'en' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = SUGGESTIONS[lang];

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome: Message = {
        id: 'welcome',
        role: 'bot',
        content: lang === 'bm'
          ? 'Assalamualaikum! 👋 Saya **Pembantu Digital TEKUN Nasional**.\n\nSaya boleh membantu anda dengan maklumat tentang:\n- Skim pembiayaan TEKUN\n- Cara mohon pembiayaan\n- Kelayakan dan dokumen diperlukan\n- Soalan umum tentang TEKUN Nasional\n\nApa yang boleh saya bantu hari ini?'
          : 'Hello! 👋 I am the **TEKUN Nasional Digital Assistant**.\n\nI can help you with:\n- TEKUN financing schemes\n- How to apply for financing\n- Eligibility and required documents\n- General questions about TEKUN Nasional\n\nHow can I help you today?',
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setShowSuggestions(false);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    // Add loading bot message
    const loadingId = (Date.now() + 1).toString();
    const loadingMsg: Message = {
      id: loadingId,
      role: 'bot',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const reply = await sendMessage(msg, history);

      // Replace loading with real reply
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId ? { ...m, content: reply, loading: false } : m
        )
      );

      // Update history for context
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: msg },
        { role: 'model', content: reply },
      ]);

      // Unread badge if closed
      if (!open) setUnread((n) => n + 1);

    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: lang === 'bm'
                  ? 'Maaf, saya menghadapi masalah teknikal. Sila cuba lagi dalam beberapa saat.'
                  : 'Sorry, I encountered a technical issue. Please try again in a moment.',
                loading: false,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setHistory([]);
    setShowSuggestions(true);
    setInput('');
    // Re-trigger welcome
    setTimeout(() => {
      const welcome: Message = {
        id: 'welcome-' + Date.now(),
        role: 'bot',
        content: lang === 'bm'
          ? 'Perbualan baharu dimulakan. Apa yang boleh saya bantu?'
          : 'New conversation started. How can I help you?',
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }, 100);
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip hint — show when closed */}
        {!open && (
          <div className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-bounce whitespace-nowrap">
            {lang === 'bm' ? '💬 Tanya Pembantu TEKUN' : '💬 Ask TEKUN Assistant'}
          </div>
        )}

        <button
          onClick={() => { setOpen(!open); setUnread(0); }}
          className={`relative h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
            open
              ? 'bg-slate-700 hover:bg-slate-800 rotate-0'
              : 'bg-[#1B2B5E] hover:bg-[#111c3d]'
          }`}
          aria-label="Toggle chatbot"
        >
          {open ? (
            <X size={22} className="text-white" />
          ) : (
            <MessageCircle size={24} className="text-white" />
          )}
          {/* Unread badge */}
          {unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
          {/* Pulse ring when closed */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-[#1B2B5E] animate-ping opacity-20" />
          )}
        </button>
      </div>

      {/* ── Chat Window ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="bg-[#1B2B5E] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Pembantu TEKUN</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <p className="text-white/60 text-[10px]">
                  {lang === 'bm' ? 'Dalam talian · Pembantu Digital TEKUN' : 'Online · TEKUN Digital Assistant'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title={lang === 'bm' ? 'Mulakan semula' : 'Reset conversation'}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <RotateCcw size={14} className="text-white/80" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronDown size={16} className="text-white/80" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'user' ? 'bg-[#1B2B5E]' : 'bg-white border border-slate-200 shadow-sm'
              }`}>
                {msg.role === 'user'
                  ? <User size={13} className="text-white" />
                  : <Sparkles size={13} className="text-[#1B2B5E]" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1B2B5E] text-white rounded-tr-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.loading ? (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 size={14} className="animate-spin text-slate-400" />
                      <span className="text-slate-400 text-xs">
                        {lang === 'bm' ? 'Sedang menaip...' : 'Typing...'}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="prose-sm"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 px-1">
                  {msg.timestamp.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="px-4 py-2 bg-white border-t border-slate-100 shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'bm' ? 'Soalan Lazim' : 'Common Questions'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs bg-slate-100 hover:bg-[#1B2B5E] hover:text-white text-slate-700 px-2.5 py-1.5 rounded-full transition-all duration-200 text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-end gap-2 bg-slate-100 rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === 'bm' ? 'Taip soalan anda...' : 'Type your question...'}
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed max-h-24"
              style={{ minHeight: '24px' }}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                input.trim() && !loading
                  ? 'bg-[#1B2B5E] text-white hover:bg-[#111c3d] active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          <p className="text-center text-[9px] text-slate-300 mt-1.5">
            TEKUN Nasional · Sistem Pengurusan Pembiayaan
          </p>
        </div>
      </div>
    </>
  );
}
