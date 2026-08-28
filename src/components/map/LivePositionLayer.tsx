"use client";

import { useEffect, useRef, useState } from "react";
import { Marker, Circle } from "react-leaflet";
import L from "leaflet";
import { haversineNm } from "@/lib/services/routeEngine";
import { bearingDeg } from "@/lib/geo";
import { useMapStore } from "@/stores/mapStore";

export interface LiveFix {
  lat: number;
  lon: number;
  sogKn: number | null;
  cogDeg: number | null;
}

/** Live GPS layer: boat marker rotated to COG + anchor-watch alarm. */
export function LivePositionLayer({
  onFix,
}: {
  onFix: (fix: LiveFix) => void;
}) {
  const [fix, setFix] = useState<LiveFix | null>(null);
  const prevRef = useRef<{ lat: number; lon: number; t: number } | null>(null);
  const anchor = useMapStore((s) => s.anchor);
  const alarmedRef = useRef(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const now = Date.now();
        let sogKn: number | null = null;
        let cogDeg: number | null = null;

        if (typeof pos.coords.speed === "number" && pos.coords.speed >= 0) {
          sogKn = pos.coords.speed * 1.94384;
        }
        if (typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading)) {
          cogDeg = pos.coords.heading;
        }

        const prev = prevRef.current;
        if (prev && (sogKn === null || cogDeg === null)) {
          const dtH = (now - prev.t) / 3_600_000;
          if (dtH > 0) {
            const dNm = haversineNm(prev.lat, prev.lon, lat, lon);
            if (sogKn === null) sogKn = dNm / dtH;
            if (cogDeg === null && dNm > 0.002)
              cogDeg = bearingDeg(prev.lat, prev.lon, lat, lon);
          }
        }
        prevRef.current = { lat, lon, t: now };

        const f = { lat, lon, sogKn, cogDeg };
        setFix(f);
        onFix(f);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [onFix]);

  // Anchor watch alarm
  useEffect(() => {
    if (!anchor || !fix) return;
    const driftM =
      haversineNm(anchor.lat, anchor.lng, fix.lat, fix.lon) * 1852;
    if (driftM > anchor.radiusM && !alarmedRef.current) {
      alarmedRef.current = true;
      if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 600]);
    }
    if (driftM <= anchor.radiusM * 0.8) alarmedRef.current = false;
  }, [fix, anchor]);

  if (!fix) return null;

  const boatIcon = L.divIcon({
    className: "",
    html: `<div style="transform: rotate(${fix.cogDeg ?? 0}deg); width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:20px solid #2DE0BE;filter: drop-shadow(0 0 8px rgba(45,224,190,0.9));"></div>`,
    iconSize: [16, 20],
    iconAnchor: [8, 10],
  });

  return (
    <>
      <Marker position={[fix.lat, fix.lon]} icon={boatIcon} />
      {anchor ? (
        <Circle
          center={[anchor.lat, anchor.lng]}
          radius={anchor.radiusM}
          pathOptions={{
            color: "#5EA0FF",
            weight: 2,
            dashArray: "4 4",
            fillOpacity: 0.05,
          }}
        />
      ) : null}
    </>
  );
}
