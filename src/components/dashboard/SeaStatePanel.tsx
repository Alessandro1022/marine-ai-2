"use client";

import { useT } from "@/lib/i18n";
import type { WeatherSnapshot } from "@/types";

/**
 * Animated sea-state panel. The SVG wave amplitude and speed are driven by
 * the real wave height so the panel "feels" like the water outside.
 */
export function SeaStatePanel({ weather }: { weather: WeatherSnapshot }) {
  const t = useT();
  const wave = weather.wave_height_m ?? 0;

  // Map wave height (0–2.5m+) to amplitude (2–14) and duration (9s–3.5s)
  const amp = Math.min(2 + wave * 5, 14);
  const duration = Math.max(9 - wave * 2.2, 3.5);
  const color =
    wave >= 1.5 ? "#F87171" : wave >= 0.8 ? "#FBBF24" : "#2DE0BE";

  const path = wavePath(amp);

  return (
    <section className="holo-panel overflow-hidden p-0">
      <div className="flex items-start justify-between p-4 pb-0">
        <div>
          <span className="instrument-label">{t("home.waves")}</span>
          <p className="instrument mt-1 text-3xl glow-text">
            {weather.wave_height_m !== null ? wave.toFixed(1) : "–"}
            <span className="ml-1 text-base text-mist">m</span>
          </p>
        </div>
        <div className="text-right">
          <span className="instrument-label">{t("home.visibility")}</span>
          <p className="instrument mt-1 text-3xl">
            {weather.visibility_m !== null
              ? Math.round(weather.visibility_m / 1000)
              : "–"}
            <span className="ml-1 text-base text-mist">km</span>
          </p>
        </div>
      </div>

      {/* Dual animated wave layers */}
      <div className="relative mt-2 h-16">
        <svg
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-full w-[200%]"
          style={{ animation: `wave-drift ${duration}s linear infinite` }}
        >
          <path d={path} fill="none" stroke={color} strokeWidth="1.5" opacity="0.85" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
        </svg>
        <svg
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-full w-[200%] opacity-40"
          style={{ animation: `wave-drift ${duration * 1.6}s linear infinite` }}
        >
          <path d={wavePath(amp * 0.6, 8)} fill="none" stroke={color} strokeWidth="1" />
        </svg>
      </div>
    </section>
  );
}

function wavePath(amp: number, offset = 0): string {
  // Two full wave cycles across 0–400 so a -50% translate loops seamlessly
  const mid = 38 + offset;
  let d = `M 0 ${mid}`;
  const cycles = 4;
  const width = 400 / cycles;
  for (let i = 0; i < cycles; i++) {
    const x = i * width;
    d += ` Q ${x + width / 4} ${mid - amp}, ${x + width / 2} ${mid}`;
    d += ` Q ${x + (3 * width) / 4} ${mid + amp}, ${x + width} ${mid}`;
  }
  return d;
}
