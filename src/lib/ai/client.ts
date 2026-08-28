export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function streamChat(params: {
  messages: ChatMsg[];
  locale: string;
  context?: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: params.messages,
      locale: params.locale,
      context: params.context,
    }),
    signal: params.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error("ai_request_failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    full += text;
    params.onChunk(text);
  }
  return full;
}
