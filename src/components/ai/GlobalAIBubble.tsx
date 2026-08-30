"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, SendHorizonal } from "lucide-react";
import { AIChatBubble } from "@/components/ai/AIChatBubble";
import { useAiChat } from "@/lib/ai/useAiChat";
import { useI18n } from "@/lib/i18n";

export function GlobalAIBubble() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, send, busy } = useAiChat({ hasMap: false, locale });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Hide on pages that already have their own AI entry point (the AI tab
  // itself, and the map which has MapAIPanel) to avoid a duplicate button.
  if (pathname?.startsWith("/ai") || pathname?.startsWith("/map")) return null;

  function handleSend(text: string) {
    setInput("");
    void send(text);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary fixed bottom-24 right-4 z-[1000] !h-12 !w-12 !rounded-full !p-0 shadow-lg"
        aria-label="Open AI assistant"
      >
        <Sparkles size={20} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1001] flex flex-col bg-deep/95 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 p-4 pt-[max(env(safe-area-inset-top),1rem)]">
            <p className="font-display text-sm font-semibold">{t("ai.title")}</p>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <AIChatBubble key={i} role={m.role} content={m.content} />
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <input
              className="input-field flex-1"
              placeholder={t("ai.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            />
            <button className="btn-primary !px-4" onClick={() => handleSend(input)} disabled={busy || !input.trim()}>
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
