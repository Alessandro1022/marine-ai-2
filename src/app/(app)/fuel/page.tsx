"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { estimateFuel } from "@/lib/services/fuelCalculator";
import { useBoatStore } from "@/stores/boatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useT } from "@/lib/i18n";
import type { BoatType, FuelEstimate } from "@/types";

export default function FuelPage() {
  const t = useT();
  const boat = useBoatStore((s) => s.primaryBoat());
  const fuelPrice = useSettingsStore((s) => s.fuelPriceSek);
  const [distance, setDistance] = useState("");
  const [boatType, setBoatType] = useState<BoatType>(boat?.boat_type ?? "motorboat");
  const [speed, setSpeed] = useState(String(boat?.cruise_speed_knots ?? 18));
  const [result, setResult] = useState<FuelEstimate | null>(null);

  function calculate() {
    setResult(
      estimateFuel({
        distanceNm: Number(distance) || 0,
        boatType,
        cruiseSpeedKnots: Number(speed) || 18,
        fuelPriceSek: fuelPrice,
      })
    );
  }

  return (
    <div>
      <PageHeader title={t("fuel.title")} />
      <div className="flex flex-col gap-3">
        <input className="input-field" inputMode="decimal" placeholder={`${t("logbook.distance")} (nm)`} value={distance} onChange={(e) => setDistance(e.target.value)} />
        <select className="input-field" value={boatType} onChange={(e) => setBoatType(e.target.value as BoatType)}>
          <option value="motorboat">{t("onboarding.motorboat")}</option>
          <option value="sailboat">{t("onboarding.sailboat")}</option>
          <option value="fishing_boat">{t("onboarding.fishingBoat")}</option>
          <option value="pwc">{t("onboarding.pwc")}</option>
        </select>
        <input className="input-field" inputMode="decimal" placeholder={t("onboarding.cruiseSpeed")} value={speed} onChange={(e) => setSpeed(e.target.value)} />
        <button className="btn-primary" onClick={calculate} disabled={!distance}>
          {t("fuel.calculate")}
        </button>

        {result ? (
          <section className="holo-panel p-5">
            <div className="grid grid-cols-2 gap-4">
              <Readout value={`${result.consumption_liters} L`} label={t("fuel.consumption")} />
              <Readout value={`${result.cost_sek} SEK`} label={t("fuel.costEstimate")} />
              <Readout value={`+${result.reserve_liters} L`} label={t("fuel.safetyReserve")} />
              <Readout value={`${result.total_recommended_liters} L`} label="Total" />
            </div>
          </section>
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
