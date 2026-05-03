'use client';

import { useEffect, useRef, useState } from 'react';
import type { DealContext, WisdomTrigger } from '@/lib/types';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialisedFor = useRef<string>('');

  // When trigger changes, reset the conversation and ask the appropriate question
  useEffect(() => {
    if (!open) return;
    const triggerKey = JSON.stringify(trigger);
    if (initialisedFor.current === triggerKey) return;
    initialisedFor.current = triggerKey;

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
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput('');
    void sendMessage(text, messages);
  }

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
          <button
            onClick={onClose}
            className="text-midgray hover:text-offwhite text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </header>

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

        <form onSubmit={handleSubmit} className="border-t border-purple/20 p-3 flex gap-2 bg-charcoal">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Real Wisdom anything…"
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
