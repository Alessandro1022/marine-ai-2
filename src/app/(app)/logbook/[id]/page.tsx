"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Trip } from "@/types";

// Same CARTO basemap setup as MarineMap.tsx — see that file for the
// full explanation of why the key/domain/param have to be exactly this.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY ?? "";
const DARK_URL = `https://tiles.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}${
  typeof window !== "undefined" && window.devicePixelRatio > 1 ? "@2x" : ""
}.png?key=${CARTO_KEY}`;

interface TripPoint {
  id: string;
  lat: number;
  lon: number;
  sog_kn: number | null;
  cog_deg: number | null;
  recorded_at: string;
}

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params.id;

  const { data: trip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("trips").select("*").eq("id", tripId).single();
      return data as Trip | null;
    },
    enabled: !!tripId,
  });

  const { data: points } = useQuery({
    queryKey: ["trip_points", tripId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("trip_points")
        .select("*")
        .eq("trip_id", tripId)
        .order("recorded_at", { ascending: true });
      return (data as TripPoint[]) ?? [];
    },
    enabled: !!tripId,
  });

  const hasRoute = (points?.length ?? 0) > 1;
  const path = (points ?? []).map((p) => [p.lat, p.lon]) as [number, number][];
  const start = points?.[0];
  const end = points?.[points.length - 1];

  // Center on the route (or first point) once points arrive
  const [center, setCenter] = useState<[number, number]>([57.7, 11.9]); // Gothenburg fallback
  useEffect(() => {
    if (start) setCenter([start.lat, start.lon]);
  }, [start]);

  const mapRef = useRef<L.Map | null>(null);
  useEffect(() => {
    if (mapRef.current && path.length > 1) {
      mapRef.current.fitBounds(path, { padding: [40, 40] });
    }
  }, [path.length]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100dvh", width: "100vw", background: "#0B1A26" }}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer url={DARK_URL} maxZoom={20} minZoom={0} />

        {hasRoute ? (
          <Polyline
            positions={path}
            pathOptions={{ color: "#2DE0BE", weight: 3, opacity: 0.9 }}
          />
        ) : null}

        {start ? (
          <CircleMarker
            center={[start.lat, start.lon]}
            radius={7}
            pathOptions={{ color: "#2DE0BE", fillColor: "#2DE0BE", fillOpacity: 1 }}
          >
            <Popup>Start</Popup>
          </CircleMarker>
        ) : null}

        {end && end !== start ? (
          <CircleMarker
            center={[end.lat, end.lon]}
            radius={7}
            pathOptions={{ color: "#FF6B6B", fillColor: "#FF6B6B", fillOpacity: 1 }}
          >
            <Popup>Slut</Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="absolute left-3 top-[max(env(safe-area-inset-top),1rem)] z-[999] flex items-center gap-1.5 rounded-xl border border-white/12 bg-deep/85 px-3 py-2 backdrop-blur"
      >
        <ArrowLeft size={16} />
        <span className="instrument-label !text-[0.65rem]">Loggbok</span>
      </button>

      {/* Trip summary card */}
      {trip ? (
        <div className="absolute bottom-6 left-3 right-3 z-[999] rounded-xl border border-white/12 bg-deep/90 p-4 backdrop-blur">
          <p className="font-display text-sm font-semibold">
            {trip.start_location || "—"} → {trip.destination || "—"}
          </p>
          <p className="mt-1 text-xs text-mist">{trip.trip_date}</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Stat value={trip.distance_nm ? `${trip.distance_nm} nm` : "–"} label="Distans" />
            <Stat value={trip.duration_minutes ? `${trip.duration_minutes} min` : "–"} label="Tid" />
            <Stat value={trip.fuel_used_liters ? `${trip.fuel_used_liters} L` : "–"} label="Bränsle" />
          </div>
          {!hasRoute ? (
            <p className="mt-3 text-[0.65rem] text-mist/60">
              Ingen GPS-rutt sparad för den här turen (manuellt inlagd, eller spelades in innan spårning fanns).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="instrument text-base">{value}</p>
      <p className="instrument-label mt-0.5">{label}</p>
    </div>
  );
}
