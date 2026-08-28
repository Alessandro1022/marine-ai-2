"use client";

import { CircleMarker, Polyline, Tooltip } from "react-leaflet";
import { useMapStore } from "@/stores/mapStore";
import { haversineNm } from "@/lib/services/routeEngine";

export function MeasureLayer() {
  const points = useMapStore((s) => s.measurePoints);
  if (points.length === 0) return null;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineNm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
  }

  return (
    <>
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={4}
          pathOptions={{ color: "#5EA0FF", fillColor: "#5EA0FF", fillOpacity: 1 }}
        />
      ))}
      {points.length > 1 ? (
        <Polyline
          positions={points.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{ color: "#5EA0FF", weight: 2, dashArray: "4 6" }}
        >
          <Tooltip permanent direction="top" opacity={0.95}>
            <span style={{ fontSize: 11, fontFamily: "monospace" }}>
              {total.toFixed(2)} nm
            </span>
          </Tooltip>
        </Polyline>
      ) : null}
    </>
  );
}
