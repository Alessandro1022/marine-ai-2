"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWeather } from "@/lib/services/weatherService";

export function useWeather(lat: number, lon: number) {
  return useQuery({
    queryKey: ["weather", Math.round(lat * 100), Math.round(lon * 100)],
    queryFn: () => fetchWeather(lat, lon),
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}
