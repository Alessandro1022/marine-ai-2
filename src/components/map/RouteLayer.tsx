"use client";

import { Marker, Polyline, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "@/stores/mapStore";
import { haversineNm } from "@/lib/services/routeEngine";
import type { RouteEcoHit } from "@/lib/services/ecoService";

const startIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#34D399;border:2px solid #E9F4F6;box-shadow:0 0 12px rgba(52,211,153,0.9);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const endIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#2DE0BE;border:2px solid #E9F4F6;box-shadow:0 0 12px rgba(45,224,190,0.9);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/** Handles tap-to-set route points + draws the route with conflict styling. */
export function RouteLayer({ hits }: { hits: RouteEcoHit[] }) {
  const { mode, routeStart, routeEnd, setRoutePoint, addMeasurePoint } =
    useMapStore();

  useMapEvents({
    click(e) {
      if (mode === "route") setRoutePoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      if (mode === "measure")
        addMeasurePoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!routeStart) return null;

  const conflict = hits.some((h) => h.crosses && h.active);
  const caution = hits.some((h) => h.crosses || (h.near && h.active));
  const color = conflict ? "#F87171" : caution ? "#FBBF24" : "#2DE0BE";

  const distance =
    routeEnd !== null
      ? haversineNm(routeStart.lat, routeStart.lng, routeEnd.lat, routeEnd.lng)
      : null;

  return (
    <>
      <Marker position={[routeStart.lat, routeStart.lng]} icon={startIcon} />
      {routeEnd ? (
        <>
          <Marker position={[routeEnd.lat, routeEnd.lng]} icon={endIcon} />
          <Polyline
            positions={[
              [routeStart.lat, routeStart.lng],
              [routeEnd.lat, routeEnd.lng],
            ]}
            pathOptions={{
              color,
              weight: 3,
              opacity: 0.95,
              dashArray: "10 6",
            }}
          >
            {distance !== null ? (
              <Tooltip permanent direction="center" opacity={0.95}>
                <span style={{ fontSize: 11, fontFamily: "monospace" }}>
                  {distance.toFixed(1)} nm
                </span>
              </Tooltip>
            ) : null}
          </Polyline>
        </>
      ) : null}
    </>
  );
}
