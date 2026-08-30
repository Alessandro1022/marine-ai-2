"use client";

import { useEffect, useState } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useAisVessels } from "@/hooks/useAisVessels";

function vesselIcon(cogDeg: number | null) {
  const rotation = cogDeg ?? 0;
  return L.divIcon({
    className: "",
    html: `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:14px solid #FFB347;transform:rotate(${rotation}deg);filter:drop-shadow(0 0 4px rgba(255,179,71,0.8));"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function AisVesselsLayer() {
  const map = useMap();
  const [bounds, setBounds] = useState(() => {
    const b = map.getBounds();
    return { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() };
  });

  useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      setBounds({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    },
  });

  const vessels = useAisVessels(bounds);

  return (
    <>
      {vessels.map((v) => (
        <Marker key={v.mmsi} position={[v.lat, v.lon]} icon={vesselIcon(v.cogDeg)}>
          <Popup>
            <strong>{v.shipName || `MMSI ${v.mmsi}`}</strong>
            <br />
            {v.sogKn !== null ? `${v.sogKn.toFixed(1)} kn` : "– kn"}
            {v.cogDeg !== null ? ` · ${Math.round(v.cogDeg)}°` : ""}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
