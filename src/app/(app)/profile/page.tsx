"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ship, Globe, CreditCard, KeyRound, LogOut, Trash2, ChevronRight, Cable, ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  async function handleDelete() {
    if (!window.confirm(t("profile.deleteConfirm"))) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Removes all user data via ON DELETE CASCADE once the auth user is deleted.
      await supabase.from("profiles").delete().eq("id", user.id);
      await signOut();
      router.push("/");
    }
  }

  return (
    <div>
      <PageHeader title={t("profile.title")} />

      {/* Profile header */}
      <section className="holo-panel flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sonar/10 font-display text-xl font-semibold text-sonar">
          {profile?.first_name?.[0] ?? "?"}
        </span>
        <div>
          <p className="font-display text-lg font-semibold">
            {profile ? `${profile.first_name} ${profile.last_name}` : "—"}
          </p>
          <p className="text-xs text-mist">{profile?.email}</p>
          <p className="instrument-label mt-1 text-sonar">
            {t(`plans.${profile?.subscription_plan ?? "free"}`)}
          </p>
        </div>
      </section>

      {/* Language */}
      <section className="glass-card mt-4 p-4">
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-sonar" />
          <span className="flex-1 text-sm">{t("profile.language")}</span>
          <div className="flex gap-2">
            {(["sv", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-full px-3 py-1 text-xs uppercase ${
                  locale === l ? "bg-sonar text-abyss font-semibold" : "border border-white/15 text-mist"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Links */}
      <div className="mt-4 flex flex-col gap-2">
        <Row href="/boats" icon={Ship} label={t("profile.boats")} />
        <Row href="/subscription" icon={CreditCard} label={t("profile.subscription")} />
        <Row href="/integrations" icon={Cable} label={t("integrations.title")} />
        <Row href="/safety" icon={ShieldAlert} label={t("safety.title")} />
        <Row href="/forgot-password" icon={KeyRound} label={t("profile.changePassword")} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button onClick={handleSignOut} className="btn-ghost">
          <LogOut size={16} /> {t("auth.logout")}
        </button>
        <button onClick={handleDelete} className="flex items-center justify-center gap-2 py-3 text-sm text-risk-red/80">
          <Trash2 size={15} /> {t("profile.deleteAccount")}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-mist/60">{t("app.copyright")}</p>
    </div>
  );
}

function Row({ href, icon: Icon, label }: { href: string; icon: typeof Ship; label: string }) {
  return (
    <Link href={href} className="glass-card flex items-center gap-3 p-4">
      <Icon size={18} className="text-sonar" />
      <span className="flex-1 text-sm">{label}</span>
      <ChevronRight size={16} className="text-mist" />
    </Link>
  );
}
