// Environmental routing intelligence for Empire Marine AI.
// Checks routes against protected water areas (bird/seal protection,
// Natura 2000, no-anchor seagrass zones, speed limits) and builds
// structured chart context that the AI can analyze.

import type { Marina } from "@/types";

export type ProtectedAreaKind =
  | "bird_protection"
  | "seal_protection"
  | "natura2000"
  | "nature_reserve"
  | "no_anchor"
  | "speed_limit";

export interface ProtectedArea {
  id: string;
  name: string;
  kind: ProtectedAreaKind;
  latitude: number;
  longitude: number;
  radius_m: number;
  season_start: string | null; // "MM-DD"
  season_end: string | null;
  restriction: string | null;
}

export const AREA_STYLE: Record<
  ProtectedAreaKind,
  { color: string; labelKey: string }
> = {
  bird_protection: { color: "#FBBF24", labelKey: "chart.birdProtection" },
  seal_protection: { color: "#F97316", labelKey: "chart.sealProtection" },
  natura2000: { color: "#34D399", labelKey: "chart.natura2000" },
  nature_reserve: { color: "#4ADE80", labelKey: "chart.natureReserve" },
  no_anchor: { color: "#F87171", labelKey: "chart.noAnchor" },
  speed_limit: { color: "#5EA0FF", labelKey: "chart.speedLimit" },
};

/** Is the area's restriction active today (seasonal areas)? */
export function isAreaActive(area: ProtectedArea, now = new Date()): boolean {
  if (!area.season_start || !area.season_end) return true;
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  if (area.season_start <= area.season_end) {
    return mmdd >= area.season_start && mmdd <= area.season_end;
  }
  // Season wraps over new year
  return mmdd >= area.season_start || mmdd <= area.season_end;
}

// --- Local flat-earth approximation (fine for <100 nm spans) ---
function toLocalMeters(
  refLat: number,
  lat: number,
  lon: number
): { x: number; y: number } {
  const mPerDegLat = 111_320;
  const mPerDegLon = 111_320 * Math.cos((refLat * Math.PI) / 180);
  return { x: lon * mPerDegLon, y: lat * mPerDegLat };
}

/** Shortest distance in meters from a point to the segment A→B. */
export function segmentDistanceM(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
  pLat: number,
  pLon: number
): number {
  const ref = (aLat + bLat) / 2;
  const A = toLocalMeters(ref, aLat, aLon);
  const B = toLocalMeters(ref, bLat, bLon);
  const P = toLocalMeters(ref, pLat, pLon);

  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = A.x + t * dx;
  const cy = A.y + t * dy;
  return Math.hypot(P.x - cx, P.y - cy);
}

export interface RouteEcoHit {
  area: ProtectedArea;
  distanceM: number;
  crosses: boolean; // route passes inside the area
  near: boolean; // within caution buffer (2x radius)
  active: boolean; // restriction in season right now
}

/** Check a straight-line route against all protected areas. */
export function checkRouteAgainstAreas(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  areas: ProtectedArea[]
): RouteEcoHit[] {
  return areas
    .map((area) => {
      const d = segmentDistanceM(
        fromLat,
        fromLon,
        toLat,
        toLon,
        area.latitude,
        area.longitude
      );
      return {
        area,
        distanceM: Math.round(d),
        crosses: d <= area.radius_m,
        near: d > area.radius_m && d <= area.radius_m * 2,
        active: isAreaActive(area),
      };
    })
    .filter((h) => h.crosses || h.near)
    .sort((a, b) => a.distanceM - b.distanceM);
}

/** Simple eco score for a route: 100 = clean, drops per conflict. */
export function ecoScore(hits: RouteEcoHit[]): number {
  let score = 100;
  for (const h of hits) {
    if (h.crosses && h.active) score -= 30;
    else if (h.crosses) score -= 15;
    else if (h.near && h.active) score -= 10;
    else score -= 4;
  }
  return Math.max(score, 0);
}

/** Structured context string the AI uses to "read" the chart. */
export function buildChartContext(params: {
  centerLat: number;
  centerLon: number;
  zoom: number;
  marinas: Marina[];
  areas: ProtectedArea[];
  weatherSummary?: string;
  routeSummary?: string;
  hits?: RouteEcoHit[];
}): string {
  const lines: string[] = [];
  lines.push(
    `Chart view center: ${params.centerLat.toFixed(4)}, ${params.centerLon.toFixed(4)} (zoom ${params.zoom}). Base layer: EMODnet bathymetry (depth shading). Overlay: OpenSeaMap seamarks (buoys, lights, fairways).`
  );
  if (params.weatherSummary) lines.push(`Weather: ${params.weatherSummary}`);
  if (params.marinas.length) {
    lines.push(
      `Marinas in view: ${params.marinas
        .slice(0, 8)
        .map((m) => `${m.name}${m.has_fuel ? " (fuel)" : ""}`)
        .join(", ")}.`
    );
  }
  if (params.areas.length) {
    lines.push(
      `Protected areas in view: ${params.areas
        .slice(0, 10)
        .map(
          (a) =>
            `${a.name} [${a.kind}${isAreaActive(a) ? ", ACTIVE now" : ", off-season"}${a.restriction ? `, ${a.restriction}` : ""}]`
        )
        .join("; ")}.`
    );
  }
  if (params.routeSummary) lines.push(`Planned route: ${params.routeSummary}`);
  if (params.hits?.length) {
    lines.push(
      `Route conflicts: ${params.hits
        .map(
          (h) =>
            `${h.area.name} (${h.crosses ? "CROSSES" : "passes " + h.distanceM + " m away"}${h.active ? ", restriction active" : ""})`
        )
        .join("; ")}. Eco score: ${ecoScore(params.hits)}/100.`
    );
  }
  return lines.join("\n");
}
