"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sailboat, Ship, Fish, Waves, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n, type Locale } from "@/lib/i18n";
import type { BoatType, SubscriptionPlan } from "@/types";

const BOAT_TYPES: { id: BoatType; key: string; icon: typeof Ship }[] = [
  { id: "motorboat", key: "onboarding.motorboat", icon: Ship },
  { id: "sailboat", key: "onboarding.sailboat", icon: Sailboat },
  { id: "fishing_boat", key: "onboarding.fishingBoat", icon: Fish },
  { id: "pwc", key: "onboarding.pwc", icon: Waves },
];

const PLANS: { id: SubscriptionPlan; key: string; descKey: string }[] = [
  { id: "free", key: "plans.free", descKey: "plans.freeDesc" },
  { id: "pro", key: "plans.pro", descKey: "plans.proDesc" },
  { id: "premium", key: "plans.premium", descKey: "plans.premiumDesc" },
];

export default function OnboardingPage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [boatType, setBoatType] = useState<BoatType>("motorboat");
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [boat, setBoat] = useState({
    name: "",
    manufacturer: "",
    model: "",
    year: "",
    fuelCapacity: "",
    cruiseSpeed: "",
  });
  const [saving, setSaving] = useState(false);

  const setB = (k: keyof typeof boat) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBoat((b) => ({ ...b, [k]: e.target.value }));

  async function finish() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    await supabase.from("boats").insert({
      user_id: user.id,
      name: boat.name || "Min båt",
      boat_type: boatType,
      manufacturer: boat.manufacturer || null,
      model: boat.model || null,
      year: boat.year ? Number(boat.year) : null,
      fuel_capacity_liters: boat.fuelCapacity ? Number(boat.fuelCapacity) : null,
      cruise_speed_knots: boat.cruiseSpeed ? Number(boat.cruiseSpeed) : null,
      is_primary: true,
    });
    await supabase
      .from("profiles")
      .update({
        language: locale,
        subscription_plan: plan,
        onboarding_completed: true,
      })
      .eq("id", user.id);
    await supabase.from("settings").upsert({ user_id: user.id });
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),2.5rem)]">
      {/* Progress */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? "bg-sonar shadow-sonar" : "bg-white/10"}`}
          />
        ))}
      </div>

      <div className="mt-10 flex-1 animate-fade-up" key={step}>
        {step === 1 && (
          <>
            <h1 className="font-display text-2xl font-semibold glow-text">{t("onboarding.languageTitle")}</h1>
            <div className="mt-6 flex flex-col gap-3">
              {(["sv", "en"] as Locale[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`glass-card flex items-center justify-between p-4 text-left ${locale === l ? "border-sonar/60" : ""}`}
                >
                  <span>{l === "sv" ? "🇸🇪 Svenska" : "🇬🇧 English"}</span>
                  {locale === l ? <Check size={18} className="text-sonar" /> : null}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-2xl font-semibold glow-text">{t("onboarding.boatTypeTitle")}</h1>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {BOAT_TYPES.map(({ id, key, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setBoatType(id)}
                  className={`glass-card flex flex-col items-center gap-2.5 p-5 ${boatType === id ? "border-sonar/60 shadow-sonar" : ""}`}
                >
                  <Icon size={26} className="text-sonar" strokeWidth={1.6} />
                  <span className="text-sm">{t(key)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-2xl font-semibold glow-text">{t("onboarding.addBoatTitle")}</h1>
            <div className="mt-6 flex flex-col gap-3">
              <input className="input-field" placeholder={t("onboarding.boatName")} value={boat.name} onChange={setB("name")} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder={t("onboarding.manufacturer")} value={boat.manufacturer} onChange={setB("manufacturer")} />
                <input className="input-field" placeholder={t("onboarding.model")} value={boat.model} onChange={setB("model")} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input className="input-field" inputMode="numeric" placeholder={t("onboarding.year")} value={boat.year} onChange={setB("year")} />
                <input className="input-field" inputMode="numeric" placeholder="L" aria-label={t("onboarding.fuelCapacity")} value={boat.fuelCapacity} onChange={setB("fuelCapacity")} />
                <input className="input-field" inputMode="numeric" placeholder="kn" aria-label={t("onboarding.cruiseSpeed")} value={boat.cruiseSpeed} onChange={setB("cruiseSpeed")} />
              </div>
              <p className="instrument-label">{t("onboarding.fuelCapacity")} · {t("onboarding.cruiseSpeed")}</p>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="font-display text-2xl font-semibold glow-text">{t("onboarding.planTitle")}</h1>
            <div className="mt-6 flex flex-col gap-3">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`${p.id === "premium" ? "holo-panel" : "glass-card"} p-4 text-left ${plan === p.id ? "border-sonar/60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold">{t(p.key)}</span>
                    {plan === p.id ? <Check size={18} className="text-sonar" /> : null}
                  </div>
                  <p className="mt-1 text-xs text-mist">{t(p.descKey)}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 pt-8">
        {step > 1 ? (
          <button className="btn-ghost flex-1" onClick={() => setStep(step - 1)}>
            {t("common.back")}
          </button>
        ) : null}
        {step < 4 ? (
          <button
            className="btn-primary flex-1"
            onClick={() => setStep(step + 1)}
            disabled={step === 3 && !boat.name}
          >
            {t("common.next")}
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={finish} disabled={saving}>
            {saving ? t("common.loading") : t("onboarding.enterDashboard")}
          </button>
        )}
      </div>
    </main>
  );
}
