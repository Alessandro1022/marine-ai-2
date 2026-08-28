"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleRegister() {
    if (form.password !== form.confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { first_name: form.firstName, last_name: form.lastName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.push("/onboarding");
    } else {
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    }
  }

  const valid =
    form.firstName && form.email && form.password.length >= 6 && form.confirm;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.register")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input-field" placeholder={t("auth.firstName")} value={form.firstName} onChange={set("firstName")} />
          <input className="input-field" placeholder={t("auth.lastName")} value={form.lastName} onChange={set("lastName")} />
        </div>
        <input className="input-field" type="email" autoComplete="email" placeholder={t("auth.email")} value={form.email} onChange={set("email")} />
        <input className="input-field" type="password" autoComplete="new-password" placeholder={t("auth.password")} value={form.password} onChange={set("password")} />
        <input className="input-field" type="password" autoComplete="new-password" placeholder={t("auth.confirmPassword")} value={form.confirm} onChange={set("confirm")} />
        {error ? <p className="text-sm text-risk-red">{error}</p> : null}
        <button className="btn-primary mt-2" onClick={handleRegister} disabled={loading || !valid}>
          {loading ? t("common.loading") : t("auth.register")}
        </button>
        <p className="mt-4 text-center text-sm text-mist">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-sonar">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
