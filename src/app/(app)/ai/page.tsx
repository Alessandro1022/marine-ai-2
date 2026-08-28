"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { AIChatBubble } from "@/components/ai/AIChatBubble";
import { PageHeader } from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";
import { streamChat, type ChatMsg } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/client";
import { useBoatStore } from "@/stores/boatStore";

export default function AIPage() {
  const { t, locale } = useI18n();
  const primaryBoat = useBoatStore((s) => s.primaryBoat());
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("chat_messages")
      .select("role, content")
      .order("created_at")
      .limit(50)
      .then(({ data }) => {
        if (data?.length) setMessages(data as ChatMsg[]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setBusy(true);

    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      void supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content });
    }

    const context = primaryBoat
      ? `User's boat: ${primaryBoat.name}, type ${primaryBoat.boat_type}, cruise ${primaryBoat.cruise_speed_knots ?? "?"} kn, fuel capacity ${primaryBoat.fuel_capacity_liters ?? "?"} L.`
      : undefined;

    let full = "";
    try {
      await streamChat({
        messages: next,
        locale,
        context,
        onChunk: (chunk) => {
          full += chunk;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: full };
            return copy;
          });
        },
      });
    } catch {
      full = t("common.error");
    }
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { role: "assistant", content: full };
      return copy;
    });
    if (user && full) {
      void supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: full });
    }
    setBusy(false);
  }

  const suggestions = [t("ai.suggested1"), t("ai.suggested2"), t("ai.suggested3"), t("ai.suggested4")];

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <PageHeader title={t("ai.title")} />

      <div className="flex flex-1 flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="glass-card p-3.5 text-left text-sm text-mist">
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
          onKeyDown={(e) => e.key === "Enter" && send(input)}
        />
        <button
          className="btn-primary !px-4"
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          aria-label="Send"
        >
          <SendHorizonal size={18} />
        </button>
      </div>
    </div>
  );
}
