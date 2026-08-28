"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, ChevronRight, BookOpen } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { useAuthStore } from "@/stores/authStore";
import { useBoatStore } from "@/stores/boatStore";
import { useT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { WindGauge } from "@/components/dashboard/WindGauge";
import { RadarDisplay } from "@/components/dashboard/RadarDisplay";
import { SeaStatePanel } from "@/components/dashboard/SeaStatePanel";
import { ForecastStrip } from "@/components/dashboard/ForecastStrip";
import { SunPanel } from "@/components/dashboard/SunPanel";
import { FuelRangePanel } from "@/components/dashboard/FuelRangePanel";
import { AIBriefing } from "@/components/dashboard/AIBriefing";
import { QuickDock } from "@/components/dashboard/QuickDock";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { MaintenanceItem, Trip, RiskLevel } from "@/types";

const RISK_LABEL: Record<RiskLevel, { dot: string; text: string; key: string }> = {
  green: { dot: "risk-dot-green", text: "text-risk-green", key: "home.riskGreen" },
  yellow: { dot: "risk-dot-yellow", text: "text-risk-yellow", key: "home.riskYellow" },
  red: { dot: "risk-dot-red", text: "text-risk-red", key: "home.riskRed" },
};

export default function DashboardPage() {
  const t = useT();
  const profile = useAuthStore((s) => s.profile);
  const primaryBoat = useBoatStore((s) => s.primaryBoat());
  const { lat, lon, isFallback } = useGeolocation();
  const { data: weather, isLoading } = useWeather(lat, lon);
  const { data: forecast } = useForecast(lat, lon);

  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("maintenance")
      .select("*")
      .is("completed_at", null)
      .order("due_date", { ascending: true })
      .limit(2)
      .then(({ data }) => setMaintenance((data as MaintenanceItem[]) ?? []));
    void supabase
      .from("trips")
      .select("*")
      .order("trip_date", { ascending: false })
      .limit(2)
      .then(({ data }) => setTrips((data as Trip[]) ?? []));
  }, []);

  if (isLoading || !weather) {
    return (
      <div className="flex flex-col gap-4">
        <GreetingHeader profile={profile} lat={lat} lon={lon} isFallback={isFallback} />
        <LoadingScreen />
      </div>
    );
  }

  const risk = RISK_LABEL[weather.risk];

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-fade-up">
        <GreetingHeader profile={profile} lat={lat} lon={lon} isFallback={isFallback} />
      </div>

      {/* Condition status line */}
      <div className="flex items-center gap-2 animate-fade-up [animation-delay:60ms]">
        <span className={risk.dot} />
        <span className={`instrument-label ${risk.text}`}>{t(risk.key)}</span>
        <span className="instrument-label ml-auto">
          {Math.round(weather.temperature_c)}°C
        </span>
      </div>

      {/* Instruments: wind gauge + radar */}
      <section className="holo-panel grid grid-cols-2 items-center gap-2 p-4 animate-fade-up [animation-delay:120ms]">
        <WindGauge
          speedMs={weather.wind_speed_ms}
          directionDeg={weather.wind_direction_deg}
        />
        <RadarDisplay lat={lat} lon={lon} />
      </section>

      {/* AI captain's briefing */}
      <div className="animate-fade-up [animation-delay:180ms]">
        <AIBriefing
          weather={weather}
          hours={forecast?.hourly ?? []}
          boat={primaryBoat}
        />
      </div>

      {/* Sea state */}
      <div className="animate-fade-up [animation-delay:240ms]">
        <SeaStatePanel weather={weather} />
      </div>

      {/* 12h forecast */}
      {forecast?.hourly?.length ? (
        <div className="animate-fade-up [animation-delay:300ms]">
          <ForecastStrip hours={forecast.hourly} />
        </div>
      ) : null}

      {/* Daylight window */}
      {forecast ? (
        <div className="animate-fade-up [animation-delay:360ms]">
          <SunPanel sunrise={forecast.sunrise} sunset={forecast.sunset} />
        </div>
      ) : null}

      {/* Boat: fuel + range */}
      {primaryBoat ? (
        <div className="animate-fade-up [animation-delay:420ms]">
          <FuelRangePanel boat={primaryBoat} />
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="animate-fade-up [animation-delay:480ms]">
        <QuickDock />
      </div>

      {/* Maintenance + recent trips */}
      {maintenance.length > 0 ? (
        <Link
          href="/maintenance"
          className="glass-card flex items-center gap-3 p-4 animate-fade-up [animation-delay:540ms]"
        >
          <Wrench size={18} className="shrink-0 text-risk-yellow" />
          <div className="min-w-0 flex-1">
            <span className="instrument-label">{t("home.upcomingMaintenance")}</span>
            <p className="truncate text-sm">{maintenance[0].title}</p>
          </div>
          <ChevronRight size={16} className="text-mist" />
        </Link>
      ) : null}

      {trips.length > 0 ? (
        <Link
          href="/logbook"
          className="glass-card flex items-center gap-3 p-4 animate-fade-up [animation-delay:600ms]"
        >
          <BookOpen size={18} className="shrink-0 text-sonar" />
          <div className="min-w-0 flex-1">
            <span className="instrument-label">{t("home.recentTrips")}</span>
            <p className="truncate text-sm">
              {trips[0].start_location} → {trips[0].destination}
            </p>
          </div>
          <ChevronRight size={16} className="text-mist" />
        </Link>
      ) : null}
    </div>
  );
}
