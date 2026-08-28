"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { estimateRoute, formatEta } from "@/lib/services/routeEngine";
import { useWeather } from "@/hooks/useWeather";
import { useBoatStore } from "@/stores/boatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useI18n } from "@/lib/i18n";
import { streamChat } from "@/lib/ai/client";
import type { Marina } from "@/types";

export default function RoutePlannerPage() {
  const { t, locale } = useI18n();
  const boat = useBoatStore((s) => s.primaryBoat());
  const fuelPrice = useSettingsStore((s) => s.fuelPriceSek);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const { data: marinas } = useQuery({
    queryKey: ["marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("marinas").select("*").order("name");
      return (data as Marina[]) ?? [];
    },
  });

  const from = marinas?.find((m) => m.id === fromId);
  const to = marinas?.find((m) => m.id === toId);

  const midLat = from && to ? (from.latitude + to.latitude) / 2 : 59.32;
  const midLon = from && to ? (from.longitude + to.longitude) / 2 : 18.55;
  const { data: weather } = useWeather(midLat, midLon);

  const route = useMemo(() => {
    if (!from || !to || !weather) return null;
    return estimateRoute({
      fromLat: from.latitude,
      fromLon: from.longitude,
      toLat: to.latitude,
      toLon: to.longitude,
      boat,
      fuelPriceSek: fuelPrice,
      weatherRisk: weather.risk,
    });
  }, [from, to, weather, boat, fuelPrice]);

  async function analyze() {
    if (!route || !from || !to || analyzing) return;
    setAnalyzing(true);
    setAnalysis("");
    const context = `Route: ${from.name} → ${to.name}. Distance ${route.distance_nm} nm, ETA ${formatEta(route.eta_minutes)}, fuel estimate ${route.fuel_liters} L. Weather at midpoint: wind ${weather?.wind_speed_ms} m/s, waves ${weather?.wave_height_m ?? "?"} m, visibility ${weather?.visibility_m ?? "?"} m, risk ${route.risk}. Boat: ${boat ? `${boat.boat_type}, ${boat.cruise_speed_knots ?? "?"} kn, tank ${boat.fuel_capacity_liters ?? "?"} L` : "unknown"}.`;
    let text = "";
    try {
      await streamChat({
        messages: [
          {
            role: "user",
            content:
              "Analyze this route: best departure strategy, comfort/safety considerations, fuel margin check, and one optimization tip. Keep it under 120 words.",
          },
        ],
        locale,
        context,
        onChunk: (c) => {
          text += c;
          setAnalysis(text);
        },
      });
    } catch {
      setAnalysis(t("common.error"));
    }
    setAnalyzing(false);
  }

  const riskClass = { green: "text-risk-green", yellow: "text-risk-yellow", red: "text-risk-red" };

  return (
    <div>
      <PageHeader title={t("route.title")} />
      <div className="flex flex-col gap-3">
        <select className="input-field" value={fromId} onChange={(e) => setFromId(e.target.value)}>
          <option value="">{t("logbook.startLocation")}</option>
          {(marinas ?? []).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select className="input-field" value={toId} onChange={(e) => setToId(e.target.value)}>
          <option value="">{t("logbook.destination")}</option>
          {(marinas ?? []).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {route ? (
          <>
            <section className="holo-panel p-5">
              <div className="grid grid-cols-2 gap-4">
                <Readout value={`${route.distance_nm}`} label={`${t("logbook.distance")} (nm)`} />
                <Readout value={formatEta(route.eta_minutes)} label={t("route.eta")} />
                <Readout value={`${route.fuel_liters} L`} label={t("route.fuelEstimate")} />
                <div>
                  <p className={`instrument text-xl ${riskClass[route.risk]}`}>
                    {t(`home.risk${route.risk[0].toUpperCase()}${route.risk.slice(1)}`)}
                  </p>
                  <p className="instrument-label mt-1">{t("route.weatherRisk")}</p>
                </div>
              </div>
              <p className="instrument-label mt-4">
                ≈ {route.fuel_cost_sek} SEK · {t("fuel.safetyReserve")} +20%
              </p>
            </section>

            <button className="btn-primary" onClick={analyze} disabled={analyzing}>
              <Sparkles size={16} /> {analyzing ? t("ai.thinking") : t("route.aiAnalysis")}
            </button>

            {analysis ? (
              <section className="glass-card p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {analysis}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="instrument text-xl">{value}</p>
      <p className="instrument-label mt-1">{label}</p>
    </div>
  );
}
