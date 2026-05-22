export type Msg = { role: "user" | "assistant"; content: string };

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("You must be logged in to use the AI chat.");
  }

  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages }),
    });
  } catch (networkErr: any) {
    throw new Error(`Network error: ${networkErr.message || "Could not reach edge function"}`);
  }

  if (!resp.ok) {
    // Try to extract JSON error body
    let errMsg = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      if (body.error) errMsg = body.error;
    } catch {
      try {
        const text = await resp.text();
        if (text) errMsg += `: ${text.slice(0, 200)}`;
      } catch { /* ignore */ }
    }

    // Safety: surface 429/500 as a toast instead of crashing the UI
    if (resp.status === 429) {
      toast.error("AI is rate-limited", {
        description: "The Gemini API quota has been hit. Please try again in a moment.",
      });
    } else if (resp.status >= 500) {
      toast.error("AI service unavailable", {
        description: errMsg || "The AI backend returned an error. Please try again shortly.",
      });
    }

    throw new Error(errMsg);
  }

  if (!resp.body) {
    throw new Error("No response body from edge function");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore partial leftovers */ }
    }
  }

  onDone();
}
