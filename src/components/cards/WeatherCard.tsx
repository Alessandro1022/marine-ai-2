"use client";

import type { WeatherSnapshot } from "@/types";
import { windDirectionLabel } from "@/lib/services/weatherService";
import { useT } from "@/lib/i18n";

const RISK_CLASS = {
  green: { dot: "risk-dot-green", text: "text-risk-green", key: "home.riskGreen" },
  yellow: { dot: "risk-dot-yellow", text: "text-risk-yellow", key: "home.riskYellow" },
  red: { dot: "risk-dot-red", text: "text-risk-red", key: "home.riskRed" },
} as const;

export function WeatherCard({ weather }: { weather: WeatherSnapshot }) {
  const t = useT();
  const risk = RISK_CLASS[weather.risk];

  return (
    <section className="holo-panel p-5">
      <div className="flex items-center justify-between">
        <span className="instrument-label">{t("home.currentWeather")}</span>
        <span className="flex items-center gap-2">
          <span className={risk.dot} />
          <span className={`instrument-label ${risk.text}`}>{t(risk.key)}</span>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <Readout
          value={weather.wind_speed_ms.toFixed(1)}
          label={`${t("home.wind")} m/s ${windDirectionLabel(weather.wind_direction_deg)}`}
        />
        <Readout
          value={weather.wave_height_m !== null ? weather.wave_height_m.toFixed(1) : "–"}
          label={`${t("home.waves")} m`}
        />
        <Readout value={`${Math.round(weather.temperature_c)}°`} label={t("home.temperature")} />
        <Readout
          value={
            weather.visibility_m !== null
              ? `${Math.round(weather.visibility_m / 1000)}`
              : "–"
          }
          label={`${t("home.visibility")} km`}
        />
      </div>
    </section>
  );
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="instrument text-xl">{value}</p>
      <p className="instrument-label mt-1 leading-tight">{label}</p>
    </div>
  );
}
