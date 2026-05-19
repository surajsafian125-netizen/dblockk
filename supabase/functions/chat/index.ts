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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["user", "assistant"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (msg.content.length > 4000) {
        return new Response(JSON.stringify({ error: "Message too long (max 4000 characters)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages in conversation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a Senior Editorial Analyst for D'block.\n\nSTRICTLY use only the information and data provided—do NOT invent facts, names, or quotes under any circumstances. Never return a single wall of text.\n\nYour response MUST be a professional editorial article of at least 600 words, formatted in clean Markdown, and MUST strictly follow this exact four-section journalistic structure, in this order, using these exact Markdown H2 headers:\n\n## The Hook\nA punchy, bold one-to-two sentence opening line that grabs attention. Use **bold** for emphasis.\n\n## The Introduction\nA brief, high-level summary paragraph of the breaking story (2-4 sentences) giving the reader the essential who/what/when/where.\n\n## The Deep Dive\nThe main body — multiple well-developed paragraphs containing the core facts, analysis, and context drawn strictly from the provided data. You may use ### sub-subheadings, bullet lists, or **bold** keywords here to break up the text. This is the longest section.\n\n## The Takeaway\nA short concluding thought or forward-looking outlook (2-4 sentences) summarizing key implications.\n\nRules:\n- Always output these four H2 sections, in this exact order, with these exact titles.\n- Never merge sections, never skip a section, never rename the headers.\n- Never wrap the article in code fences.\n- Maintain an authoritative, objective tone suitable for a major news outlet.\n- Do not add any content or information not present in the provided data.",
         
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
