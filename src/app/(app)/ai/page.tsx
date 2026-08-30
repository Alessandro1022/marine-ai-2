"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { AIChatBubble } from "@/components/ai/AIChatBubble";
import { PageHeader } from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";
import { useAiChat } from "@/lib/ai/useAiChat";

export default function AIPage() {
  const { t, locale } = useI18n();
  // hasMap: false — map-only tools (set_route, fly_to) show a friendly
  // "open the map" message instead of silently failing here.
  const { messages, send, busy } = useAiChat({ hasMap: false, locale });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(text: string) {
    setInput("");
    void send(text);
  }

  const suggestions = [t("ai.suggested1"), t("ai.suggested2"), t("ai.suggested3"), t("ai.suggested4")];

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <PageHeader title={t("ai.title")} />
      <div className="flex flex-1 flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => handleSend(s)} className="glass-card p-3.5 text-left text-sm text-mist">
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => <AIChatBubble key={i} role={m.role} content={m.content} />)
        )}
        <div ref={bottomRef} />
      </div>
      <div className="sticky bottom-24 mt-4 flex gap-2">
        <input
          className="input-field flex-1"
          placeholder={t("ai.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
        />
        <button
          className="btn-primary !px-4"
          onClick={() => handleSend(input)}
          disabled={busy || !input.trim()}
          aria-label="Send"
        >
          <SendHorizonal size={18} />
        </button>
      </div>
    </div>
  );
}
