"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.updatePassword")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        <input className="input-field" type="password" placeholder={t("auth.newPassword")} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="input-field" type="password" placeholder={t("auth.confirmPassword")} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error ? <p className="text-sm text-risk-red">{error}</p> : null}
        <button className="btn-primary mt-2" onClick={handleUpdate} disabled={loading || password.length < 6 || !confirm}>
          {loading ? t("common.loading") : t("auth.updatePassword")}
        </button>
      </div>
    </div>
  );
}
