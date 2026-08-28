"use client";

import Link from "next/link";
import { Anchor, Bot, CloudSun, Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function WelcomePage() {
  const { t, locale, setLocale } = useI18n();

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),2.5rem)]">
      {/* Language switch */}
      <div className="flex justify-end">
        <button
          onClick={() => setLocale(locale === "sv" ? "en" : "sv")}
          className="instrument-label rounded-full border border-white/10 px-3 py-1.5"
          aria-label="Switch language"
        >
          {locale === "sv" ? "EN" : "SV"}
        </button>
      </div>

      {/* Hero */}
      <div className="mt-14 animate-fade-up">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sonar/10 text-sonar shadow-sonar">
          <Anchor size={28} strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight">
          Empire
          <br />
          Marine <span className="text-sonar">AI</span>
        </h1>
        <p className="mt-3 text-mist">{t("auth.welcomeSubtitle")}</p>
      </div>

      {/* Instrument preview — the signature readout */}
      <div className="holo-panel mt-10 animate-fade-up p-5 [animation-delay:120ms]">
        <div className="flex items-center justify-between">
          <span className="instrument-label">{t("home.currentWeather")}</span>
          <span className="flex items-center gap-2">
            <span className="risk-dot-green" />
            <span className="instrument-label text-risk-green">
              {t("home.riskGreen")}
            </span>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="instrument text-2xl">4.2</p>
            <p className="instrument-label mt-1">{t("home.wind")} m/s</p>
          </div>
          <div>
            <p className="instrument text-2xl">0.3</p>
            <p className="instrument-label mt-1">{t("home.waves")} m</p>
          </div>
          <div>
            <p className="instrument text-2xl">18°</p>
            <p className="instrument-label mt-1">{t("home.temperature")}</p>
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div className="mt-6 grid animate-fade-up grid-cols-3 gap-3 [animation-delay:240ms]">
        {[
          { icon: Bot, key: "nav.ai" },
          { icon: Compass, key: "route.title" },
          { icon: CloudSun, key: "home.currentWeather" },
        ].map(({ icon: Icon, key }) => (
          <div key={key} className="glass-card flex flex-col items-center gap-2 p-4">
            <Icon size={20} className="text-sonar" strokeWidth={1.75} />
            <span className="text-center text-xs text-mist">{t(key)}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-auto flex flex-col gap-3 pt-10">
        <Link href="/register" className="btn-primary">
          {t("auth.register")}
        </Link>
        <Link href="/login" className="btn-ghost">
          {t("auth.login")}
        </Link>
        <p className="mt-2 text-center text-xs text-mist/70">
          {t("app.copyright")}
        </p>
      </div>
    </main>
  );
}
