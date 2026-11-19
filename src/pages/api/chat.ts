/**
 * Chat API Route
 * POST /api/chat
 * 
 * Handles AI chat requests with portfolio context
 * Rate limited to 20 messages per session
 */

import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { OPENAI_API_KEY, OPENAI_BASE_URL, CHAT_MODEL } from 'astro:env/server';
import { buildSystemPrompt, sanitizeChatHistory } from '../../utils/portfolioContext';

// On-demand route: needs an adapter (see astro.config.mjs)
export const prerender = false;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

interface ChatResponse {
  message?: string;
  error?: string;
}

// Rate limiting in-memory store (simple implementation)
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // messages per session
const RATE_WINDOW = 3600000; // 1 hour in ms

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(sessionId);

  if (!record || now > record.resetAt) {
    // New session or expired
    rateLimitStore.set(sessionId, {
      count: 1,
      resetAt: now + RATE_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function getSessionId(request: Request): string {
  // Simple session ID from IP + User-Agent hash
  // In production, use proper session management
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return `${ip}-${ua}`.slice(0, 100);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' } as ChatResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { message, history } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message format' } as ChatResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Message too long (max 500 characters)' } as ChatResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const sessionId = getSessionId(request);
    if (!checkRateLimit(sessionId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in an hour.' 
        } as ChatResponse),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Secrets come from astro:env, so they are read at runtime and never
    // inlined into the build output. Any OpenAI-compatible provider works
    // via OPENAI_BASE_URL + CHAT_MODEL (Gemini, Groq, OpenRouter, ...).
    const apiKey = OPENAI_API_KEY;
    const baseURL = OPENAI_BASE_URL;
    const model = CHAT_MODEL || 'gpt-4o-mini';
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Chat assistant temporarily unavailable. Please contact via email.' 
        } as ChatResponse),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize the OpenAI-compatible client
    const openai = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });

    // Build system prompt with portfolio context
    const systemPrompt = buildSystemPrompt();

    // Prepare messages (limit history to last 10 validated user/assistant turns)
    const recentHistory = sanitizeChatHistory(history);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message },
    ];

    // Call the API. Penalty parameters are OpenAI-specific; stricter
    // OpenAI-compatible providers (e.g. Gemini) reject unknown fields.
    const completion = await openai.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9,
      ...(baseURL ? {} : { frequency_penalty: 0.3, presence_penalty: 0.3 }),
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    // Return response
    return new Response(
      JSON.stringify({ message: assistantMessage } as ChatResponse),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        } 
      }
    );

  } catch (error: any) {
    console.error('Chat API error:', error);

    // Handle specific errors
    if (error.code === 'insufficient_quota') {
      return new Response(
        JSON.stringify({ 
          error: 'Chat temporarily unavailable. Please contact via email.' 
        } as ChatResponse),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error.status === 429) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please wait a moment and try again.' 
        } as ChatResponse),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get response. Please try again or contact via email.' 
      } as ChatResponse),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// OPTIONS for CORS preflight (if needed)
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
