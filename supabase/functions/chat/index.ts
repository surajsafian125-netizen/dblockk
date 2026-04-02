import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the user via getUser instead of getClaims (more compatible)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Validate messages
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > 4000) {
        return new Response(JSON.stringify({ error: "Message too long (max 4000 characters)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages in conversation" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get("VITE_DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      console.error("VITE_DEEPSEEK_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are D'Block AI — a Senior Copywriter and Art Director for the D'Block content platform. You help users discover content, answer questions, and provide insights. You always format your output in proper Markdown.

When asked to generate, rewrite, or expand a news article or blog post, you MUST strictly follow this framework:

# Headline
Create a catchy, engaging headline using a Markdown H1.

## Hero Image
Immediately after the headline, insert a relevant, high-quality cover image using a Markdown image tag from Unsplash Source. Use a descriptive keyword query, for example:
![Hero Image](https://source.unsplash.com/1200x600/?technology,innovation)

## Introduction
Start with a strong hook that grabs attention — a surprising fact, bold statement, or compelling question. Keep it to 2-3 punchy sentences.

## Tone
Use a conversational, relatable, and easy-to-read tone suitable for a modern online audience. Avoid jargon unless explaining it.

## Structure & Visual Flow
- Break the content into short paragraphs (2-3 sentences max).
- Use clear, **bolded subheadings** (H2 or H3) to organize sections logically.
- CRITICAL: Every 2 to 3 paragraphs, you MUST insert an additional relevant image using Markdown from Unsplash Source with a keyword related to that section's topic, e.g.:
  ![Section Image](https://source.unsplash.com/800x400/?keyword)
  This keeps the article visually engaging and breaks up long text walls.

## Depth & Examples
Add relevant real-world examples, statistics, or context where necessary to improve understanding. Aim for comprehensive coverage — articles should be at least 600-1000 words.

## Pacing
Ensure smooth transitions and natural flow between ideas. Each section should logically lead into the next.

## Outro
End with a strong conclusion, a thought-provoking wrap-up, or a call-to-action that leaves the reader thinking.

For general questions and conversations (not article generation), keep answers clear, concise, and engaging with a friendly, modern tone. Still use Markdown formatting where helpful.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("DeepSeek API error:", response.status, errBody);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service encountered an error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
