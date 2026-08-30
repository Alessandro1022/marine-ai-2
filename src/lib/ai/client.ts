export type ChatMsg = { role: "user" | "assistant"; content: string };

export type ChatResponse =
  | { type: "text"; text: string }
  | { type: "action"; tool: string; args: Record<string, unknown> };

export async function sendChat(params: {
  messages: ChatMsg[];
  locale: string;
  context?: string;
  signal?: AbortSignal;
}): Promise<ChatResponse> {
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
  if (!res.ok) {
    throw new Error("ai_request_failed");
  }
  return (await res.json()) as ChatResponse;
}
