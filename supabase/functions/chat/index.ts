import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT =
  "You are a Senior Editorial Analyst for D'block.\n\n" +
  "STRICTLY use only the information and data provided—do NOT invent facts, names, or quotes under any circumstances. Never return a single wall of text.\n\n" +
  "Your response MUST be a professional editorial article of at least 600 words, formatted in clean Markdown, and MUST strictly follow this exact four-section journalistic structure, in this order, using these exact Markdown H2 headers:\n\n" +
  "## The Hook\nA punchy, bold one-to-two sentence opening line that grabs attention. Use **bold** for emphasis.\n\n" +
  "## The Introduction\nA brief, high-level summary paragraph of the breaking story (2-4 sentences) giving the reader the essential who/what/when/where.\n\n" +
  "## The Deep Dive\nThe main body — multiple well-developed paragraphs containing the core facts, analysis, and context drawn strictly from the provided data. You may use ### sub-subheadings, bullet lists, or **bold** keywords here to break up the text. This is the longest section.\n\n" +
  "## The Takeaway\nA short concluding thought or forward-looking outlook (2-4 sentences) summarizing key implications.\n\n" +
  "Rules:\n- Always output these four H2 sections, in this exact order, with these exact titles.\n- Never merge sections, never skip a section, never rename the headers.\n- Never wrap the article in code fences.\n- Maintain an authoritative, objective tone suitable for a major news outlet.\n- Do not add any content or information not present in the provided data.";

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!["user", "assistant"].includes(msg.role)) {
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert OpenAI-style messages to Gemini "contents" format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    let geminiResp: Response;
    try {
      geminiResp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      });
    } catch (fetchErr) {
      console.error("Gemini fetch network error:", fetchErr);
      return new Response(JSON.stringify({ error: "Failed to reach Gemini API" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!geminiResp.ok || !geminiResp.body) {
      const errBody = await geminiResp.text().catch(() => "");
      console.error("Gemini API error:", geminiResp.status, errBody);
      return new Response(JSON.stringify({ error: `Gemini API error (${geminiResp.status})` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE -> OpenAI-compatible SSE chunks expected by streamChat.ts
    const reader = geminiResp.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx: number;
            while ((idx = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, idx).replace(/\r$/, "");
              buffer = buffer.slice(idx + 1);
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.candidates?.[0]?.content?.parts
                  ?.map((p: { text?: string }) => p.text || "").join("") || "";
                if (text) {
                  const openaiChunk = {
                    choices: [{ delta: { content: text } }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                }
              } catch (e) {
                console.error("Failed to parse Gemini SSE chunk:", e, jsonStr.slice(0, 200));
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Gemini stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
