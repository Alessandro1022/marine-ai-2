"use client";

import { Sunrise, Sunset, MoonStar } from "lucide-react";
import { useT } from "@/lib/i18n";

export function SunPanel({
  sunrise,
  sunset,
}: {
  sunrise: string | null;
  sunset: string | null;
}) {
  const t = useT();
  if (!sunrise || !sunset) return null;

  const now = new Date();
  const sunsetDate = new Date(sunset);
  const minutesToSunset = Math.round((sunsetDate.getTime() - now.getTime()) / 60000);
  const nightfallSoon = minutesToSunset > 0 && minutesToSunset <= 120;

  // Day progress 0..1
  const sunriseDate = new Date(sunrise);
  const progress = Math.min(
    Math.max(
      (now.getTime() - sunriseDate.getTime()) /
        (sunsetDate.getTime() - sunriseDate.getTime()),
      0
    ),
    1
  );

  return (
    <section className="glass-card p-4">
      <div className="flex items-center justify-between">
        <span className="panel-title">
          <Sunrise size={15} className="text-risk-yellow" />
          <span className="instrument text-sm">{fmtTime(sunrise)}</span>
        </span>
        <span className="instrument-label">{t("home.daylight")}</span>
        <span className="panel-title">
          <span className="instrument text-sm">{fmtTime(sunset)}</span>
          <Sunset size={15} className="text-sonar" />
        </span>
      </div>

      {/* Sun arc */}
      <div className="relative mt-3 h-2 rounded-full bg-white/8 bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-risk-yellow/70 to-sonar"
          style={{ width: `${progress * 100}%` }}
        />
        <span
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-foam"
          style={{
            left: `calc(${progress * 100}% - 6px)`,
            boxShadow: "0 0 10px rgba(233,244,246,0.9)",
          }}
        />
      </div>

      {nightfallSoon ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-risk-yellow">
          <MoonStar size={13} />
          {t("home.nightfall", { minutes: minutesToSunset })}
        </p>
      ) : null}
    </section>
  );
}

function fmtTime(iso: string): string {
  return iso.slice(11, 16);
}
