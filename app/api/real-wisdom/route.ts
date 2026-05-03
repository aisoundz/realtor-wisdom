import { anthropic, REAL_WISDOM_MODEL, REAL_WISDOM_SYSTEM_PROMPT } from '@/lib/anthropic/client';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, dealContext, portfolioContext } = await request.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'messages required' }, { status: 400 });
  }

  // Inject deal/portfolio context as a system-level addendum to the user's last message
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

  const stream = await anthropic.messages.create({
    model: REAL_WISDOM_MODEL,
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
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
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
}
