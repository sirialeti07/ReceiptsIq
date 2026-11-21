import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User } from 'lucide-react';
import { answerQuery, type ChatMessage } from '@/lib/chatbot';

const SUGGESTIONS = [
  "What's expiring soon?",
  'How much did I spend this month?',
  'Show receipts from Best Buy',
  'Give me a summary',
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your ReceiptIQ assistant. Ask me about your spending, upcoming return deadlines, or search for specific receipts. Type 'help' to see what I can do.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);
    try {
      const reply = await answerQuery(q);
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I ran into a problem answering that. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#0F172A] py-3 pl-4 pr-5 text-sm font-bold text-white shadow-lg shadow-[#0F172A]/20 transition-all hover:scale-[1.03] hover:bg-[#1E293B]"
      >
        <MessageSquare className="h-5 w-5 text-[#DC2626]" />
        Ask ReceiptIQ
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#047857] opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[#047857]" />
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-40 flex h-[100vh] w-full flex-col rounded-none border-l border-slate-200 bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:h-[600px] sm:w-[380px] sm:rounded-2xl sm:border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">ReceiptIQ Assistant</p>
            <p className="flex items-center gap-1 text-[11px] text-[#047857]">
              <Sparkles className="h-3 w-3" /> Online · ready to help
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0F172A]"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                m.role === 'user'
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-slate-100 text-[#0F172A]'
              }`}
            >
              {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-tr-sm bg-[#DC2626] text-white'
                  : 'rounded-tl-sm bg-slate-50 text-[#0F172A]'
              }`}
            >
              {renderMarkdownLite(m.content)}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[#0F172A]">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#DC2626] hover:text-[#DC2626]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your receipts…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0F172A] text-white transition-colors hover:bg-[#1E293B] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

/** Minimal **bold** rendering without pulling in a markdown lib. */
function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} className="font-bold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
