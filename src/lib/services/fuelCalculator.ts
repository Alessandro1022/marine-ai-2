import type { BoatType, FuelEstimate } from "@/types";

// Baseline liters per nautical mile at reference cruise speed
const BASELINE: Record<BoatType, { lPerNm: number; refSpeed: number }> = {
  motorboat: { lPerNm: 1.2, refSpeed: 20 },
  fishing_boat: { lPerNm: 1.0, refSpeed: 16 },
  pwc: { lPerNm: 0.9, refSpeed: 30 },
  sailboat: { lPerNm: 0.35, refSpeed: 6 }, // engine-assisted
};

const RESERVE_RATIO = 0.2; // recommended 20% safety reserve

export function estimateFuel(params: {
  distanceNm: number;
  boatType: BoatType;
  cruiseSpeedKnots: number;
  fuelPriceSek: number;
}): FuelEstimate {
  const base = BASELINE[params.boatType] ?? BASELINE.motorboat;
  // Consumption rises non-linearly with speed above reference
  const speedFactor = Math.max(
    0.6,
    Math.pow(params.cruiseSpeedKnots / base.refSpeed, 1.5)
  );
  const consumption = params.distanceNm * base.lPerNm * speedFactor;
  const reserve = consumption * RESERVE_RATIO;

  return {
    consumption_liters: round1(consumption),
    cost_sek: round1(consumption * params.fuelPriceSek),
    reserve_liters: round1(reserve),
    total_recommended_liters: round1(consumption + reserve),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function litersPerNm(boatType: BoatType, cruiseSpeedKnots: number): number {
  const base = BASELINE[boatType] ?? BASELINE.motorboat;
  const speedFactor = Math.max(
    0.6,
    Math.pow(cruiseSpeedKnots / base.refSpeed, 1.5)
  );
  return base.lPerNm * speedFactor;
}
