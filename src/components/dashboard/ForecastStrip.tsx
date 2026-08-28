"use client";

import type { HourlyPoint } from "@/lib/services/weatherService";
import { useT } from "@/lib/i18n";

const RISK_DOT = {
  green: "risk-dot-green",
  yellow: "risk-dot-yellow",
  red: "risk-dot-red",
} as const;

export function ForecastStrip({ hours }: { hours: HourlyPoint[] }) {
  const t = useT();
  if (hours.length === 0) return null;

  const maxWind = Math.max(...hours.map((h) => h.wind_speed_ms), 1);

  return (
    <section className="glass-card p-4">
      <span className="instrument-label">{t("home.forecast")}</span>
      <div className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
        {hours.map((h) => {
          const hour = h.time.slice(11, 16);
          const barH = Math.max((h.wind_speed_ms / maxWind) * 36, 3);
          return (
            <div
              key={h.time}
              className="flex min-w-[3rem] flex-col items-center gap-1.5 rounded-xl px-1 py-2"
            >
              <span className="instrument-label">{hour}</span>
              <span className="instrument text-sm">
                {Math.round(h.temperature_c)}°
              </span>
              {/* Wind bar */}
              <div className="flex h-9 items-end">
                <div
                  className="w-1.5 rounded-full bg-sonar/70"
                  style={{ height: `${barH}px`, boxShadow: "0 0 6px rgba(45,224,190,0.5)" }}
                />
              </div>
              <span className="instrument text-[0.65rem] text-mist">
                {h.wind_speed_ms.toFixed(0)}
              </span>
              <span className={RISK_DOT[h.risk]} style={{ width: 6, height: 6 }} />
            </div>
          );
        })}
      </div>
      <p className="instrument-label mt-1 text-right">m/s</p>
    </section>
  );
}
