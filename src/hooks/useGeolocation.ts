"use client";

import { useEffect, useState } from "react";

// Default: Stockholm archipelago
const FALLBACK = { lat: 59.32, lon: 18.55 };

export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lon: number }>(FALLBACK);
  const [isFallback, setIsFallback] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsFallback(false);
      },
      () => setIsFallback(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  return { ...position, isFallback };
}
