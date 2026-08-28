"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") ?? "");
  }, []);

  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sonar/10 text-sonar shadow-sonar">
        <MailCheck size={26} strokeWidth={1.75} />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold glow-text">
        {t("auth.verifyEmailTitle")}
      </h1>
      <p className="mt-3 text-sm text-mist">
        {t("auth.verifyEmailBody", { email })}
      </p>
      <Link href="/login" className="btn-ghost mt-8 inline-flex">
        {t("auth.login")}
      </Link>
    </div>
  );
}
