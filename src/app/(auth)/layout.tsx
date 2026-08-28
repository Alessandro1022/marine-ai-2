"use client";

import Link from "next/link";
import { Anchor } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),2.5rem)]">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sonar/10 text-sonar">
          <Anchor size={20} strokeWidth={1.75} />
        </span>
        <span className="font-display text-lg font-semibold">
          Empire Marine <span className="text-sonar">AI</span>
        </span>
      </Link>

      <div className="mt-10 animate-fade-up">{children}</div>

      <p className="mt-auto pt-10 text-center text-xs text-mist/70">
        {t("app.copyright")}
      </p>
    </main>
  );
}
