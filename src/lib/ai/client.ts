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

// LEGACY SHIM — kept so callers not yet migrated to sendChat()/action-handling
// still build. It can't actually execute client tools (start_trip, set_route,
// etc.) since it has no store access, so an "action" response just becomes a
// plain-text fallback message. Migrate each caller to sendChat() directly,
// then delete this once nothing imports streamChat anymore.
export async function streamChat(params: {
  messages: ChatMsg[];
  locale: string;
  context?: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const result = await sendChat(params);
  const text =
    result.type === "text"
      ? result.text
      : "Den här vyn stödjer inte AI-åtgärder än — öppna kartan för det.";
  params.onChunk(text);
  return text;
}
