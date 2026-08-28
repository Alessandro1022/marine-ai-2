"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.resetPassword")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        {sent ? (
          <p className="glass-card p-4 text-sm text-mist">{t("auth.resetLinkSent")}</p>
        ) : (
          <>
            <input
              className="input-field"
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn-primary mt-2" onClick={handleSend} disabled={loading || !email}>
              {loading ? t("common.loading") : t("auth.sendResetLink")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
