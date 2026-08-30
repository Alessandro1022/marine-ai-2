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
  if (!res.ok) throw new Error("ai_request_failed");
  return (await res.json()) as ChatResponse;
}

// Streaming-aware send: reveals text answers word by word via onTextChunk,
// and reports tool-call actions via onAction (single call, not streamed).
export async function sendChatStream(params: {
  messages: ChatMsg[];
  locale: string;
  context?: string;
  onTextChunk: (chunk: string) => void;
  onAction: (tool: string, args: Record<string, unknown>) => void;
  signal?: AbortSignal;
}): Promise<void> {
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
  if (!res.ok) throw new Error("ai_request_failed");

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as ChatResponse;
    if (data.type === "action") {
      params.onAction(data.tool, data.args);
    } else {
      params.onTextChunk(data.text ?? "");
    }
    return;
  }

  // text/plain streamed response
  if (!res.body) {
    params.onTextChunk(await res.text());
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    params.onTextChunk(decoder.decode(value, { stream: true }));
  }
}

// LEGACY SHIM — kept so callers not yet migrated (route-planner, AIBriefing,
// MapAIPanel) still build. Can't execute client tools since it has no store
// access. Migrate each caller to useAiChat()/sendChatStream(), then delete.
export async function streamChat(params: {
  messages: ChatMsg[];
  locale: string;
  context?: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  let full = "";
  await sendChatStream({
    ...params,
    onTextChunk: (chunk) => {
      full += chunk;
      params.onChunk(chunk);
    },
    onAction: () => {
      const text = "Den här vyn stödjer inte AI-åtgärder än — öppna kartan för det.";
      full = text;
      params.onChunk(text);
    },
  });
  return full;
}
