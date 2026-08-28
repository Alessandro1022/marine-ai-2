"use client";

import { Waves } from "lucide-react";

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 p-8 text-center">
      <Waves size={28} className="text-sonar/60" strokeWidth={1.5} />
      <p className="text-sm text-mist">{text}</p>
      {action}
    </div>
  );
}
