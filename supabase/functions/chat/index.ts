import { STATUS_CODE } from "https://deno.land/std@0.224.0/http/status.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const sseHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

const systemPrompt = `You are a Senior Editorial Analyst for D'block.

STRICTLY use only the raw imported article text provided by the user. Do not invent facts, names, quotes, dates, locations, numbers, context, or claims.

Restructure the article into clean Markdown using exactly these four H2 sections, in this exact order:

## The Hook
A punchy, bold one-to-two sentence opening that captures the core story.

## Introduction
A concise high-level summary of the essential who, what, when, and where.

## The Deep Dive
The main body with the core facts, context, and analysis drawn only from the provided article text. Use paragraphs, bullets, or H3 subheadings when helpful.

## The Takeaway
A short closing outlook that summarizes the key implications without adding new facts.

Never wrap the response in code fences. Return only the formatted Markdown article.`;

type ChatMessage = {
  role?: string;
  content?: unknown;
};

function jsonResponse(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: jsonHeaders,
  });
}

function extractNewsText(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const directText = record.text ?? record.articleText ?? record.content ?? record.prompt;
  if (typeof directText === "string" && directText.trim()) {
    return directText.trim();
  }

  if (Array.isArray(record.messages)) {
    const userMessages = (record.messages as ChatMessage[])
      .filter((message) => message?.role === "user" && typeof message.content === "string")
      .map((message) => (message.content as string).trim())
      .filter(Boolean);

    if (userMessages.length > 0) {
      return userMessages[userMessages.length - 1];
    }
  }

  return null;
}

function toOpenAICompatibleStream(markdown: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const chunk = {
        choices: [{ delta: { content: markdown } }],
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse("Method not allowed", STATUS_CODE.MethodNotAllowed);
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY environment variable");
      return new Response(JSON.stringify({ error: "Missing API Key" }), {
        status: STATUS_CODE.BadRequest,
        headers: jsonHeaders,
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Invalid JSON request body:", error);
      return jsonResponse("Invalid JSON request body", STATUS_CODE.BadRequest);
    }

    const newsText = extractNewsText(body);
    if (!newsText) {
      return jsonResponse("Missing article text", STATUS_CODE.BadRequest);
    }

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: newsText }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    };

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });
    } catch (error) {
      console.error("Gemini fetch failed:", error);
      return jsonResponse("Failed to reach Gemini API", STATUS_CODE.BadGateway);
    }

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      const errorBody = await geminiResponse.text().catch(() => "");
      console.error("Gemini API error:", status, errorBody);
      return jsonResponse(
        status === 429 ? "Gemini API rate limit exceeded" : `Gemini API error (${status})`,
        status === 429 ? 429 : STATUS_CODE.BadGateway,
      );
    }

    const geminiData = await geminiResponse.json();
    const markdown = geminiData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!markdown) {
      console.error("Gemini response missing markdown content:", JSON.stringify(geminiData).slice(0, 1000));
      return jsonResponse("Gemini returned an empty response", STATUS_CODE.BadGateway);
    }

    return new Response(toOpenAICompatibleStream(markdown), {
      status: STATUS_CODE.OK,
      headers: sseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Chat edge function failed:", message, error);

    return new Response(JSON.stringify({ error: `Chat function error: ${message}` }), {
      status: STATUS_CODE.InternalServerError,
      headers: jsonHeaders,
    });
  }
});