"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { streamChat } from "@/lib/ai/client";
import { useI18n } from "@/lib/i18n";
import type { Boat, WeatherSnapshot } from "@/types";
import type { HourlyPoint } from "@/lib/services/weatherService";

export function AIBriefing({
  weather,
  hours,
  boat,
}: {
  weather: WeatherSnapshot;
  hours: HourlyPoint[];
  boat: Boat | null;
}) {
  const { t, locale } = useI18n();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const startedRef = useRef(false);

  const generate = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setText("");

    const trend =
      hours.length > 3
        ? `Trend next hours: wind ${hours[0].wind_speed_ms.toFixed(0)}→${hours[
            Math.min(5, hours.length - 1)
          ].wind_speed_ms.toFixed(0)} m/s, waves ${
            hours[0].wave_height_m ?? "?"
          }→${hours[Math.min(5, hours.length - 1)].wave_height_m ?? "?"} m.`
        : "";
    const context = [
      `Now: wind ${weather.wind_speed_ms} m/s, waves ${weather.wave_height_m ?? "?"} m, temp ${weather.temperature_c}°C, visibility ${weather.visibility_m ?? "?"} m, risk ${weather.risk}.`,
      trend,
      boat
        ? `Boat: ${boat.boat_type}, cruise ${boat.cruise_speed_knots ?? "?"} kn, fuel ${Math.round(boat.fuel_level_percent)}%.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    let acc = "";
    try {
      await streamChat({
        messages: [
          {
            role: "user",
            content:
              "Write today's captain's briefing for me: 2-3 short sentences. Cover whether conditions are suitable, the best time window based on the trend, and one concrete optimization tip (fuel, comfort or fishing). No greeting, no list.",
          },
        ],
        locale,
        context,
        onChunk: (c) => {
          acc += c;
          setText(acc);
        },
      });
    } catch {
      setText(t("home.briefingUnavailable"));
    }
    setBusy(false);
  }, [busy, weather, hours, boat, locale, t]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void generate();
  }, [generate]);

  return (
    <section className="holo-panel p-4">
      <div className="flex items-center justify-between">
        <span className="panel-title">
          <Sparkles size={15} className="text-sonar animate-pulse" />
          <span className="instrument-label">{t("home.briefing")}</span>
        </span>
        <button
          onClick={generate}
          disabled={busy}
          aria-label={t("home.regenerate")}
          className="text-mist transition-colors hover:text-sonar disabled:opacity-40"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
        </button>
      </div>
      <p
        className={`mt-2.5 min-h-[3.5rem] text-sm leading-relaxed text-foam/90 whitespace-pre-wrap ${
          busy ? "caret" : ""
        }`}
      >
        {text || (busy ? "" : t("ai.thinking"))}
      </p>
    </section>
  );
}
