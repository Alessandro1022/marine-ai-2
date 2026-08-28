"use client";

import { windDirectionLabel } from "@/lib/services/weatherService";
import { useT } from "@/lib/i18n";
import type { RiskLevel } from "@/types";

const MAX_WIND = 20; // gauge ceiling m/s
const RISK_COLOR: Record<RiskLevel, string> = {
  green: "#34D399",
  yellow: "#FBBF24",
  red: "#F87171",
};

function windRisk(ms: number): RiskLevel {
  if (ms >= 11) return "red";
  if (ms >= 7) return "yellow";
  return "green";
}

/** Arc gauge for wind speed + rotating direction needle */
export function WindGauge({
  speedMs,
  directionDeg,
}: {
  speedMs: number;
  directionDeg: number;
}) {
  const t = useT();
  const risk = windRisk(speedMs);
  const color = RISK_COLOR[risk];

  // Arc spans 240° starting at 150°
  const ratio = Math.min(speedMs / MAX_WIND, 1);
  const circumference = 2 * Math.PI * 40;
  const arcLength = (240 / 360) * circumference;
  const filled = arcLength * ratio;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-[105deg]">
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          {/* Value */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: "stroke-dasharray 0.8s ease",
            }}
          />
        </svg>
        {/* Ticks */}
        <svg viewBox="0 0 100 100" className="absolute inset-0">
          {Array.from({ length: 9 }).map((_, i) => {
            const a = ((150 + i * 30) * Math.PI) / 180;
            const x1 = 50 + 33 * Math.cos(a);
            const y1 = 50 + 33 * Math.sin(a);
            const x2 = 50 + 36.5 * Math.cos(a);
            const y2 = 50 + 36.5 * Math.sin(a);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={i % 2 === 0 ? "tick-major" : "tick"}
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="instrument text-2xl glow-text">{speedMs.toFixed(1)}</span>
          <span className="instrument-label">m/s</span>
        </div>
        {/* Direction needle (small arrow on outer ring) */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotate(${directionDeg}deg)`,
            transition: "transform 1s ease",
          }}
        >
          <span
            className="absolute left-1/2 top-0 -translate-x-1/2 text-[0.6rem]"
            style={{ color }}
          >
            ▼
          </span>
        </div>
      </div>
      <p className="instrument-label mt-1.5">
        {t("home.wind")} · {windDirectionLabel(directionDeg)} {Math.round(directionDeg)}°
      </p>
    </div>
  );
}
