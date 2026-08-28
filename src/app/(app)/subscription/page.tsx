"use client";

import { Check } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { SubscriptionPlan } from "@/types";

const PLANS: { id: SubscriptionPlan; key: string; descKey: string; price: string }[] = [
  { id: "free", key: "plans.free", descKey: "plans.freeDesc", price: "0 kr" },
  { id: "pro", key: "plans.pro", descKey: "plans.proDesc", price: "79 kr/mån" },
  { id: "premium", key: "plans.premium", descKey: "plans.premiumDesc", price: "149 kr/mån" },
];

export default function SubscriptionPage() {
  const t = useT();
  const { profile, refreshProfile } = useAuthStore();

  async function choose(plan: SubscriptionPlan) {
    // Payment processing (RevenueCat / Stripe) is wired in the native release.
    // For now this switches the plan directly.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ subscription_plan: plan }).eq("id", user.id);
    await refreshProfile();
  }

  return (
    <div>
      <PageHeader title={t("profile.subscription")} />
      <div className="flex flex-col gap-3">
        {PLANS.map((p) => {
          const current = profile?.subscription_plan === p.id;
          return (
            <div key={p.id} className={p.id === "premium" ? "holo-panel p-5" : "glass-card p-5"}>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold">{t(p.key)}</span>
                <span className="instrument text-sonar">{p.price}</span>
              </div>
              <p className="mt-1.5 text-xs text-mist">{t(p.descKey)}</p>
              <button
                className={current ? "btn-ghost mt-4 w-full" : "btn-primary mt-4 w-full"}
                onClick={() => choose(p.id)}
                disabled={current}
              >
                {current ? (
                  <>
                    <Check size={15} /> {t("plans.current")}
                  </>
                ) : (
                  t("plans.upgrade")
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
