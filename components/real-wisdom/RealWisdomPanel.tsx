'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { recalculateAndPersistRIS } from '@/lib/ris/recalculate';
import type { DealContext, WisdomTrigger } from '@/lib/types';

// Web Speech API types (not in default TS libs)
interface SpeechRecognitionResultLike {
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const QUICK_PROMPTS = [
  { label: '🚧 What\'s blocking close?', prompt: 'What is the single most pressing thing blocking construction close on this deal? Be specific to the data — not generic advice.' },
  { label: '💰 Find unclaimed capital', prompt: 'Look at this deal\'s profile — location, AMI targeting, deal type. What real estate capital programs am I likely to qualify for that I haven\'t applied to yet? Cite specific programs by name.' },
  { label: '✉️ Draft outreach', prompt: 'Draft a short, direct outreach email to the most important pending stakeholder on this deal. Reference the specific deal context.' },
  { label: '⚠️ 90-day risk', prompt: 'Forecast the top 3 risks to this deal in the next 90 days, ranked by likelihood × impact. Focus on the things actually visible in the deal data.' },
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function RealWisdomPanel({
  open,
  onClose,
  trigger,
  dealContext,
}: {
  open: boolean;
  onClose: () => void;
  trigger: WisdomTrigger;
  dealContext: DealContext;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [loggedAt, setLoggedAt] = useState<number | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logValue, setLogValue] = useState('');
  const [listening, setListening] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pastConversations, setPastConversations] = useState<
    { id: string; title: string | null; updated_at: string; messages: Message[] }[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialisedFor = useRef<string>('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // When trigger changes, reset the conversation and ask the appropriate question
  useEffect(() => {
    if (!open) return;
    const triggerKey = JSON.stringify(trigger);
    if (initialisedFor.current === triggerKey) return;
    initialisedFor.current = triggerKey;

    setConversationId(null);
    setShowHistory(false);

    // Load past conversations for this deal
    if (dealContext.deal?.id) {
      const supabase = createClient();
      void supabase
        .from('wisdom_conversations')
        .select('id, title, updated_at, messages')
        .eq('deal_id', dealContext.deal.id)
        .order('updated_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          setPastConversations(
            (data ?? []).map((c) => ({
              ...c,
              messages: Array.isArray(c.messages) ? (c.messages as Message[]) : [],
            }))
          );
        });
    }

    const seedPrompt = buildPromptForTrigger(trigger);
    if (seedPrompt) {
      setMessages([]);
      setError(null);
      void sendMessage(seedPrompt, []);
    } else {
      setMessages([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  async function sendMessage(text: string, history: Message[]) {
    setStreaming(true);
    setError(null);
    const userMsg: Message = { role: 'user', content: text };
    const newHistory = [...history, userMsg];
    setMessages([...newHistory, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/real-wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, dealContext }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages((curr) => {
                const copy = [...curr];
                copy[copy.length - 1] = { role: 'assistant', content: assistantText };
                return copy;
              });
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // ignore parse errors on partial chunks
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStreaming(false);
      // Persist conversation after each round (user + assistant message)
      if (dealContext.deal?.id) {
        await persistConversation();
      }
    }
  }

  async function persistConversation() {
    if (!dealContext.deal?.id) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    // Build a latest snapshot — read messages via callback to avoid stale closure
    const currentMessages = await new Promise<Message[]>((resolve) => {
      setMessages((m) => {
        resolve(m);
        return m;
      });
    });
    const title = currentMessages[0]?.content?.slice(0, 80) ?? null;

    if (conversationId) {
      await supabase
        .from('wisdom_conversations')
        .update({
          messages: currentMessages,
          title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    } else {
      const { data } = await supabase
        .from('wisdom_conversations')
        .insert({
          deal_id: dealContext.deal.id,
          user_id: user.id,
          title,
          messages: currentMessages,
        })
        .select('id')
        .single();
      if (data?.id) {
        setConversationId(data.id);
      }
    }
  }

  function loadConversation(c: { id: string; messages: Message[] }) {
    setConversationId(c.id);
    setMessages(c.messages);
    setShowHistory(false);
    setError(null);
  }

  function startFresh() {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput('');
    void sendMessage(text, messages);
  }

  async function logBeliefMoment() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant || !dealContext.deal?.id) return;
    setLogging(true);
    const supabase = createClient();
    const cleanedValue = logValue.replace(/[^0-9.]/g, '');
    const downstreamValue = cleanedValue ? Number(cleanedValue) : null;
    const { error } = await supabase.from('belief_capital_moments').insert({
      deal_id: dealContext.deal.id,
      developer_org_id: dealContext.deal.org_id,
      description: `${lastUser ? `Q: ${lastUser.content.slice(0, 150)}\n\n` : ''}A: ${lastAssistant.content.slice(0, 1000)}`,
      moment_type: 'belief_support',
      downstream_value: downstreamValue,
    });
    if (!error) {
      // Also log to activity feed
      await supabase.from('activity_log').insert({
        deal_id: dealContext.deal.id,
        org_id: dealContext.deal.org_id,
        actor: 'You',
        action: downstreamValue
          ? `Logged a belief capital moment ($${downstreamValue.toLocaleString()} downstream value)`
          : 'Logged a belief capital moment from Real Wisdom conversation',
        type: 'belief_capital',
      });
      await recalculateAndPersistRIS(supabase, dealContext.deal.id);
      setLoggedAt(Date.now());
      setShowLogForm(false);
      setLogValue('');
    }
    setLogging(false);
  }

  function startVoiceInput() {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input not supported in this browser. Try Chrome or Safari.');
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e: SpeechRecognitionEventLike) => {
      const results = Array.from({ length: e.results.length }, (_, i) => e.results[i]);
      const transcript = results.map((r) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  const lastIsAssistantWithContent =
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].content.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-charcoal border-l border-purple/30 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="px-5 py-4 border-b border-purple/20 flex items-center justify-between bg-purple/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple animate-pulse" />
            <h3 className="font-serif text-lg text-purple-light">Real Wisdom</h3>
          </div>
          <div className="flex items-center gap-2">
            {dealContext.deal?.id && pastConversations.length > 0 && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="text-xs text-midgray hover:text-purple-light px-2 py-1 rounded transition"
                title="Past conversations"
              >
                {pastConversations.length} past
              </button>
            )}
            <button
              onClick={onClose}
              className="text-midgray hover:text-offwhite text-xl leading-none px-2"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        {showHistory && (
          <div className="border-b border-purple/20 bg-charcoal/60 max-h-64 overflow-y-auto">
            <div className="px-4 py-3 flex items-center justify-between text-xs text-midgray border-b border-purple/15">
              <span>Past conversations</span>
              <button
                onClick={startFresh}
                className="text-purple-light hover:text-purple"
              >
                + Start fresh
              </button>
            </div>
            <ul>
              {pastConversations.map((c) => (
                <li
                  key={c.id}
                  onClick={() => loadConversation(c)}
                  className={`px-4 py-3 cursor-pointer hover:bg-charcoal/80 transition border-b last:border-b-0 border-purple/10 ${
                    c.id === conversationId ? 'bg-purple/15' : ''
                  }`}
                >
                  <div className="text-sm truncate">{c.title || 'Untitled conversation'}</div>
                  <div className="text-xs text-midgray mt-0.5">
                    {new Date(c.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                    {' · '}
                    {c.messages.length} message{c.messages.length === 1 ? '' : 's'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="text-sm text-midgray text-center py-12">
              <p>Click any capital row, compliance item, or milestone — Real Wisdom will analyze it in real time.</p>
              <p className="mt-2">Or ask anything below.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {streaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1].content === '' && (
            <div className="text-sm text-purple-light/60 italic">Thinking…</div>
          )}
          {lastIsAssistantWithContent && !streaming && dealContext.deal?.id && (
            <div>
              {loggedAt && Date.now() - loggedAt < 3000 ? (
                <span className="text-xs text-teal">✓ Logged as belief capital moment</span>
              ) : showLogForm ? (
                <div className="bg-amber/5 border border-amber/30 rounded-lg p-3 space-y-2">
                  <label className="text-xs text-amber-light">Downstream value (optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logValue}
                      onChange={(e) => setLogValue(e.target.value)}
                      placeholder="e.g. 1000000"
                      className="flex-1 bg-charcoal/60 border border-amber/30 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-amber"
                    />
                    <button
                      onClick={logBeliefMoment}
                      disabled={logging}
                      className="bg-amber text-charcoal px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {logging ? 'Saving…' : 'Save moment'}
                    </button>
                    <button
                      onClick={() => {
                        setShowLogForm(false);
                        setLogValue('');
                      }}
                      className="text-midgray hover:text-offwhite text-sm px-2"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-midgray">
                    Total dollars enabled or kept-alive by this conversation. Leave blank for non-monetary moments.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogForm(true)}
                  className="text-xs px-2.5 py-1 rounded-full border border-amber/30 text-amber hover:bg-amber/10 transition"
                >
                  ✨ Log as belief capital moment
                </button>
              )}
            </div>
          )}
          {error && (
            <div className="text-sm bg-red/10 border border-red/30 rounded-lg px-3 py-3 space-y-2">
              <div className="font-medium text-red">Real Wisdom failed</div>
              <div className="text-offwhite/80 break-words">{error}</div>
              <div className="text-xs text-midgray pt-1 border-t border-red/20">
                Common fixes:
                <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                  <li>Anthropic API key missing or invalid in Vercel env vars</li>
                  <li>Anthropic billing not set up — add a payment method at console.anthropic.com</li>
                  <li>Rate limit hit — wait a minute and try again</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-purple/20 bg-charcoal">
          {/* Quick prompts */}
          <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                onClick={() => void sendMessage(q.prompt, messages)}
                disabled={streaming}
                className="text-xs px-2.5 py-1 rounded-full bg-purple/10 hover:bg-purple/20 border border-purple/30 text-purple-light transition disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="p-3 flex gap-2">
            <button
              type="button"
              onClick={listening ? stopVoiceInput : startVoiceInput}
              disabled={streaming}
              title={listening ? 'Stop' : 'Voice input'}
              className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition ${
                listening
                  ? 'bg-red/20 border-red animate-pulse'
                  : 'bg-charcoal/60 border-purple/30 hover:border-purple'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? 'Listening…' : 'Ask Real Wisdom anything…'}
              disabled={streaming}
              className="flex-1 bg-charcoal/60 border border-purple/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="bg-purple hover:bg-purple-dark text-offwhite px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-purple/15 border border-purple/30 text-offwhite px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-sm leading-snug">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="bg-charcoal/60 border border-purple/20 text-offwhite px-3.5 py-2.5 rounded-2xl rounded-tl-sm max-w-[90%] text-sm leading-relaxed">
        {message.content ? <Markdown text={message.content} /> : <span className="text-midgray italic">…</span>}
      </div>
    </div>
  );
}

// Inline markdown renderer — handles headings (# ## ###), **bold**, *italic*, `code`,
// ordered lists (1. 2.), and unordered lists (- * •). No external deps.
function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const sizeClass =
            block.level === 1
              ? 'text-lg font-serif text-purple-light'
              : block.level === 2
                ? 'text-base font-semibold text-purple-light'
                : 'text-sm font-semibold text-offwhite';
          return (
            <div key={i} className={`${sizeClass} ${i > 0 ? 'mt-3' : ''} mb-1`}>
              <Inline text={block.text} />
            </div>
          );
        }
        if (block.type === 'unordered_list') {
          return (
            <ul key={i} className="my-1.5 space-y-1 list-disc list-outside ml-5 marker:text-purple-light/60">
              {block.items.map((item, j) => (
                <li key={j} className="leading-snug pl-1">
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ordered_list') {
          return (
            <ol key={i} className="my-1.5 space-y-1 list-decimal list-outside ml-5 marker:text-purple-light/70 marker:font-medium">
              {block.items.map((item, j) => (
                <li key={j} className="leading-snug pl-1">
                  <Inline text={item} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            <Inline text={block.text} />
          </p>
        );
      })}
    </>
  );
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'unordered_list'; items: string[] }
  | { type: 'ordered_list'; items: string[] };

// Line-by-line parser. Groups consecutive list items, flushes on blank lines or new block types.
function parseBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;
  let listKind: 'ordered_list' | 'unordered_list' | null = null;

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  }

  function flushList() {
    if (list && listKind) {
      blocks.push({ type: listKind, items: list });
      list = null;
      listKind = null;
    }
  }

  for (const raw of lines) {
    const line = raw.trim();

    // Blank line — flush whatever's open
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading: # / ## / ### up to 6 hashes
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      continue;
    }

    // Ordered list item: "1. text" or "1) text"
    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listKind !== 'ordered_list') {
        flushList();
        listKind = 'ordered_list';
        list = [];
      }
      list!.push(orderedMatch[1]);
      continue;
    }

    // Unordered list item: "- text", "* text", or "• text"
    const unorderedMatch = line.match(/^[-*•]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listKind !== 'unordered_list') {
        flushList();
        listKind = 'unordered_list';
        list = [];
      }
      list!.push(unorderedMatch[1]);
      continue;
    }

    // Plain text line — accumulate into paragraph (and end any list)
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

// Render inline markdown: **bold**, *italic*, `code`. Handles nesting safely.
function Inline({ text }: { text: string }) {
  // Tokenize via regex captures, preserving the matched delimiters in alternating chunks
  const tokens = tokenizeInline(text);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.kind === 'bold') return <strong key={i} className="font-semibold text-offwhite">{tok.text}</strong>;
        if (tok.kind === 'italic') return <em key={i}>{tok.text}</em>;
        if (tok.kind === 'code')
          return (
            <code key={i} className="bg-charcoal/80 border border-teal-mid/30 rounded px-1 py-0.5 text-xs font-mono">
              {tok.text}
            </code>
          );
        return <span key={i}>{tok.text}</span>;
      })}
    </>
  );
}

type InlineToken = { kind: 'text' | 'bold' | 'italic' | 'code'; text: string };

function tokenizeInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  while (i < input.length) {
    // Bold (**text**)
    if (input.slice(i, i + 2) === '**') {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        tokens.push({ kind: 'bold', text: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    // Code (`text`)
    if (input[i] === '`') {
      const end = input.indexOf('`', i + 1);
      if (end !== -1) {
        tokens.push({ kind: 'code', text: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Italic (*text*) — only if not part of **
    if (input[i] === '*' && input[i + 1] !== '*' && input[i - 1] !== '*') {
      const end = input.indexOf('*', i + 1);
      if (end !== -1 && input[end + 1] !== '*') {
        tokens.push({ kind: 'italic', text: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Plain text — append to last text token or create new one
    const last = tokens[tokens.length - 1];
    if (last && last.kind === 'text') {
      last.text += input[i];
    } else {
      tokens.push({ kind: 'text', text: input[i] });
    }
    i++;
  }
  return tokens;
}

function buildPromptForTrigger(trigger: WisdomTrigger): string | null {
  switch (trigger.kind) {
    case 'auto':
      return trigger.prompt;
    case 'capital_source': {
      const s = trigger.source;
      const dollars = s.committed_amount ? `$${(s.committed_amount / 1_000_000).toFixed(2)}M` : '';
      return `Analyze the ${s.name} ${dollars} ${s.source_type ?? ''} on this deal. Status: ${s.status}.${s.notes ? ` Note: ${s.notes}` : ''} What's the most important thing to know, what's the risk, and what should I do next?`;
    }
    case 'checklist': {
      const i = trigger.item;
      return `Compliance item: "${i.name}" (status: ${i.status}${i.blocking_close ? ', BLOCKS construction close' : ''}${i.notes ? `, notes: ${i.notes}` : ''}). What's the fastest path to clearing this and what's the risk if it slips?`;
    }
    case 'milestone': {
      const m = trigger.milestone;
      return `Milestone: "${m.name}" — ${m.status}, target ${m.target_date}. Are we on track? What needs to happen in the next 2 weeks to hit it?`;
    }
    case 'free':
      return null;
    default:
      return null;
  }
}
