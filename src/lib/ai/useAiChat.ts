"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendChatStream, type ChatMsg } from "@/lib/ai/client";
import { useAiToolExecutor } from "@/lib/ai/toolExecutors";

export function useAiChat(opts?: {
  hasMap?: boolean;
  flyTo?: (lat: number, lon: number, zoom?: number) => void;
  context?: string;
  locale?: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const executeTool = useAiToolExecutor();

  // Loads the last 50 messages so returning to the chat shows prior turns —
  // this is one continuous history per user, not separate saved threads.
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

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
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

      let full = "";
      let actionHandledPersist = false;
      try {
        await sendChatStream({
          messages: next,
          locale: opts?.locale ?? "sv",
          context: opts?.context,
          onTextChunk: (chunk) => {
            full += chunk;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: full };
              return copy;
            });
          },
          onAction: (tool, args) => {
            actionHandledPersist = true;
            void executeTool(
              { type: "action", tool, args },
              { hasMap: opts?.hasMap, flyTo: opts?.flyTo }
            ).then((confirmText) => {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: confirmText };
                return copy;
              });
              if (user && confirmText) {
                void supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: confirmText });
              }
            });
          },
        });
      } catch {
        full = "Något gick fel. Försök igen.";
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: full };
          return copy;
        });
      }

      if (!actionHandledPersist && user && full) {
        void supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: full });
      }
      setBusy(false);
    },
    [messages, busy, opts, executeTool]
  );

  return { messages, send, busy };
}
