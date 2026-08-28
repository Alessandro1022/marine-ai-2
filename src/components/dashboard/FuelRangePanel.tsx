"use client";

import { litersPerNm } from "@/lib/services/fuelCalculator";
import { useT } from "@/lib/i18n";
import type { Boat } from "@/types";

/**
 * Estimated remaining range ring, computed from tank size, fuel level and
 * the boat's consumption model at cruise speed.
 */
export function FuelRangePanel({ boat }: { boat: Boat }) {
  const t = useT();

  const percent = boat.fuel_level_percent ?? 100;
  const capacity = boat.fuel_capacity_liters ?? null;
  const cruise = boat.cruise_speed_knots ?? 18;

  const litersLeft = capacity !== null ? (capacity * percent) / 100 : null;
  const lpnm = litersPerNm(boat.boat_type, cruise);
  // Keep 20% as untouchable reserve in the displayed range
  const rangeNm =
    litersLeft !== null ? Math.max((litersLeft * 0.8) / lpnm, 0) : null;

  const low = percent < 25;
  const color = low ? "#F87171" : "#2DE0BE";
  const circumference = 2 * Math.PI * 40;
  const filled = circumference * (percent / 100);

  return (
    <section className="holo-panel flex items-center gap-4 p-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`instrument text-xl ${low ? "text-risk-red" : ""}`}>
            {Math.round(percent)}%
          </span>
          <span className="instrument-label">{t("home.fuelStatus")}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold">{boat.name}</p>
        <p className="truncate text-xs text-mist">
          {boat.manufacturer} {boat.model} {boat.year ? `· ${boat.year}` : ""}
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div>
            <p className="instrument text-lg glow-text">
              {rangeNm !== null ? Math.round(rangeNm) : "–"}
              <span className="ml-1 text-xs text-mist">nm</span>
            </p>
            <p className="instrument-label">{t("home.range")}</p>
          </div>
          <div>
            <p className="instrument text-lg">
              {litersLeft !== null ? Math.round(litersLeft) : "–"}
              <span className="ml-1 text-xs text-mist">L</span>
            </p>
            <p className="instrument-label">{t("home.fuelLeft")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
