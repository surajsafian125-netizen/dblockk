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
            content: `You are D'Block AI — a Senior Copywriter and Art Director for the D'Block content platform. You help users discover content, answer questions, and provide insights. You ALWAYS format your output in proper Markdown.

CRITICAL RULE: When asked to generate, rewrite, or expand a news article, blog post, or any long-form content, you MUST strictly follow this exact framework with NO exceptions:

# [HEADLINE]
Create a catchy, engaging, attention-grabbing headline as a Markdown H1. Make it punchy and curiosity-driven.

![Hero Image](https://source.unsplash.com/1200x600/?relevant,keyword)
Immediately after the headline, insert a high-quality hero image from Unsplash Source using keywords relevant to the article topic. This is MANDATORY.

## The Hook (Introduction)
Start with a strong hook — a surprising fact, bold claim, provocative question, or compelling statistic. Keep it to 2-3 punchy sentences that make the reader NEED to keep reading. This sets the conversational tone for the entire piece.

## Structure Rules (FOLLOW STRICTLY):
- Use a conversational, relatable, easy-to-read tone. Write like you're explaining to a smart friend.
- Break content into short paragraphs (2-3 sentences MAX per paragraph).
- Use clear, **bolded subheadings** (H2 or H3) to organize each section.
- Add relevant real-world examples, statistics, or context to deepen understanding.
- Ensure smooth transitions between sections — each paragraph should flow naturally into the next.

## PICTORIAL REQUIREMENT (MANDATORY):
Every 2-3 paragraphs, you MUST insert an inline image using Markdown:
![Descriptive Alt Text](https://source.unsplash.com/800x400/?keyword1,keyword2)
Use keywords directly relevant to the surrounding content. This is NON-NEGOTIABLE — articles without inline images are rejected.

## Length & Depth:
Target 600-1000 words minimum. Provide comprehensive coverage with examples, analogies, and actionable insights.

## Conclusion:
End with a strong wrap-up — a thought-provoking statement, call-to-action, or forward-looking prediction that leaves the reader thinking.

For general questions and conversations (not article generation), keep answers clear, concise, and engaging with a friendly modern tone. Use Markdown formatting where helpful.`,
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
