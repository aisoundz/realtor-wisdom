import { anthropic, REAL_WISDOM_MODEL, REAL_WISDOM_SYSTEM_PROMPT } from '@/lib/anthropic/client';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingMessage = { role: 'user' | 'assistant'; content: string };

// Models to try in order. If the configured model fails, we fall through.
// This protects against model deprecation or typos in env vars.
const MODEL_FALLBACKS = [REAL_WISDOM_MODEL, 'claude-sonnet-4-5', 'claude-3-5-sonnet-20241022'];

export async function POST(request: Request) {
  // Auth check
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // API key check (clearer error than letting Anthropic SDK throw)
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not set on the server' },
      { status: 500 }
    );
  }

  let body: { messages?: IncomingMessage[]; dealContext?: unknown; portfolioContext?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { messages, dealContext, portfolioContext } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'messages array required' }, { status: 400 });
  }

  // Inject deal/portfolio context into the user's last message
  const contextBlock = dealContext
    ? `Deal context:\n${JSON.stringify(dealContext, null, 2)}`
    : portfolioContext
      ? `Portfolio context:\n${JSON.stringify(portfolioContext, null, 2)}`
      : 'No deal context provided.';

  const conversationMessages = messages.map((m: IncomingMessage, i: number) => {
    if (i === messages.length - 1 && m.role === 'user') {
      return { role: 'user' as const, content: `${contextBlock}\n\nUser message: ${m.content}` };
    }
    return { role: m.role, content: m.content };
  });

  // Try each model until one works (or all fail)
  let lastError: unknown = null;
  for (const model of MODEL_FALLBACKS) {
    try {
      const stream = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: REAL_WISDOM_SYSTEM_PROMPT,
        messages: conversationMessages,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (
                chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta'
              ) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (err) {
      lastError = err;
      // Only retry on model-not-found errors. Anything else is real.
      const msg = err instanceof Error ? err.message : String(err);
      const isModelError = /model|not.found|invalid_request/i.test(msg);
      if (!isModelError) break;
      // Otherwise keep looping to next model
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  return Response.json(
    { error: `All Real Wisdom models failed. Last error: ${message}` },
    { status: 500 }
  );
}
