"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      setError(t("auth.invalidCredentials"));
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", data.user.id)
      .single();
    router.push(profile?.onboarding_completed ? "/dashboard" : "/onboarding");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.login")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        <input
          className="input-field"
          type="email"
          autoComplete="email"
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          autoComplete="current-password"
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-risk-red">{error}</p> : null}
        <button
          className="btn-primary mt-2"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? t("common.loading") : t("auth.login")}
        </button>
        <Link
          href="/forgot-password"
          className="mt-1 text-center text-sm text-mist underline-offset-4 hover:underline"
        >
          {t("auth.forgotPassword")}
        </Link>
        <p className="mt-4 text-center text-sm text-mist">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-sonar">
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
