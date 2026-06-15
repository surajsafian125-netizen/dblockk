export type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-ai`;

export async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch (networkErr: any) {
    throw new Error(networkErr?.message || "Could not reach the assistant");
  }

  if (!resp.ok) {
    let errMsg = `Request failed (${resp.status})`;
    try {
      const body = await resp.json();
      if (body?.error) errMsg = body.error;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  if (!resp.body) throw new Error("Empty response from assistant");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;

      const payload = line.slice(6).trim();
      if (payload === "[DONE]") { onDone(); return; }

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content as string | undefined;
        if (delta) onDelta(delta);
      } catch {
        // partial — push back
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();
}
