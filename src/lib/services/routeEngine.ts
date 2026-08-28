import type { Boat, RiskLevel, RouteEstimate } from "@/types";
import { estimateFuel } from "./fuelCalculator";

const ROUTING_FACTOR = 1.18; // real water routes are longer than great-circle

export function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // earth radius in nautical miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function estimateRoute(params: {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  boat: Pick<Boat, "boat_type" | "cruise_speed_knots"> | null;
  fuelPriceSek: number;
  weatherRisk: RiskLevel;
}): RouteEstimate {
  const distance =
    haversineNm(params.fromLat, params.fromLon, params.toLat, params.toLon) *
    ROUTING_FACTOR;
  const speed = params.boat?.cruise_speed_knots || 18;
  const etaMinutes = (distance / speed) * 60;
  const fuel = estimateFuel({
    distanceNm: distance,
    boatType: params.boat?.boat_type ?? "motorboat",
    cruiseSpeedKnots: speed,
    fuelPriceSek: params.fuelPriceSek,
  });

  return {
    distance_nm: round1(distance),
    eta_minutes: Math.round(etaMinutes),
    fuel_liters: round1(fuel.consumption_liters),
    fuel_cost_sek: Math.round(fuel.cost_sek),
    risk: params.weatherRisk,
  };
}

export function formatEta(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
