"use client";

import { Bot } from "lucide-react";

export function AIChatBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-sonar/15 border border-sonar/25 px-4 py-2.5 text-sm whitespace-pre-wrap">
        {content}
      </div>
    );
  }
  return (
    <div className="flex max-w-[92%] gap-2.5">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sonar/10 text-sonar">
        <Bot size={15} strokeWidth={1.75} />
      </span>
      <div className="glass-card rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
        {content || "…"}
      </div>
    </div>
  );
}
