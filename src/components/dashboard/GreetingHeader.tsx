"use client";

import { useEffect, useState } from "react";
import { formatDM } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import type { Profile } from "@/types";

export function GreetingHeader({
  profile,
  lat,
  lon,
  isFallback,
}: {
  profile: Profile | null;
  lat: number;
  lon: number;
  isFallback: boolean;
}) {
  const { t, locale } = useI18n();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hour = now?.getHours() ?? 12;
  const greetingKey =
    hour < 5
      ? "home.goodNight"
      : hour < 10
        ? "home.goodMorning"
        : hour < 18
          ? "home.goodDay"
          : "home.goodEvening";

  const dateStr = now
    ? now.toLocaleDateString(locale === "sv" ? "sv-SE" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  return (
    <header className="flex items-start justify-between">
      <div>
        <p className="instrument-label">{dateStr}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight glow-text">
          {t(greetingKey)}
          {profile?.first_name ? `, ${profile.first_name}` : ""}
        </h1>
        <p className="instrument mt-1.5 text-[0.7rem] text-sonar/80">
          {formatDM(lat, true)} {formatDM(lon, false)}
          {isFallback ? ` · ${t("home.approxPosition")}` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className="instrument text-2xl glow-text" suppressHydrationWarning>
          {now
            ? now.toLocaleTimeString(locale === "sv" ? "sv-SE" : "en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--:--"}
        </p>
        <p className="instrument-label">{t("home.localTime")}</p>
      </div>
    </header>
  );
}
