"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { haversineNm } from "@/lib/services/routeEngine";
import { bearingDeg } from "@/lib/geo";
import { useT } from "@/lib/i18n";
import type { Marina } from "@/types";

const RADAR_RANGE_NM = 25;

/**
 * Holographic radar that plots real marinas around the user's position.
 * Blip placement uses true bearing + distance, scaled to the radar radius.
 */
export function RadarDisplay({ lat, lon }: { lat: number; lon: number }) {
  const t = useT();

  const { data: marinas } = useQuery({
    queryKey: ["marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("marinas").select("*");
      return (data as Marina[]) ?? [];
    },
    staleTime: 30 * 60_000,
  });

  const blips = useMemo(() => {
    return (marinas ?? [])
      .map((m) => {
        const dist = haversineNm(lat, lon, m.latitude, m.longitude);
        const brg = bearingDeg(lat, lon, m.latitude, m.longitude);
        return { id: m.id, name: m.name, dist, brg };
      })
      .filter((b) => b.dist <= RADAR_RANGE_NM)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 8);
  }, [marinas, lat, lon]);

  return (
    <div className="relative">
      <div className="radar mx-auto h-44 w-44">
        {/* Cardinal labels */}
        {(["N", "E", "S", "W"] as const).map((c, i) => (
          <span
            key={c}
            className="instrument-label absolute text-[0.55rem] text-sonar/70"
            style={cardinalPos(i)}
          >
            {c}
          </span>
        ))}
        {/* Marina blips */}
        {blips.map((b, i) => {
          const r = (b.dist / RADAR_RANGE_NM) * 44; // % of radius
          const angle = ((b.brg - 90) * Math.PI) / 180;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          return (
            <span
              key={b.id}
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sonar"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                boxShadow: "0 0 8px rgba(45,224,190,0.9)",
                animation: `blip-pulse ${2 + (i % 3) * 0.7}s ease-in-out infinite`,
              }}
              title={b.name}
            />
          );
        })}
      </div>
      <p className="instrument-label mt-2 text-center">
        {blips.length} {t("home.nearby")} · {RADAR_RANGE_NM} nm
      </p>
    </div>
  );
}

function cardinalPos(i: number): React.CSSProperties {
  switch (i) {
    case 0:
      return { top: "4px", left: "50%", transform: "translateX(-50%)" };
    case 1:
      return { right: "5px", top: "50%", transform: "translateY(-50%)" };
    case 2:
      return { bottom: "4px", left: "50%", transform: "translateX(-50%)" };
    default:
      return { left: "5px", top: "50%", transform: "translateY(-50%)" };
  }
}
