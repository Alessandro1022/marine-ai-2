"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchForecastDetail } from "@/lib/services/weatherService";

export function useForecast(lat: number, lon: number) {
  return useQuery({
    queryKey: ["forecast", Math.round(lat * 100), Math.round(lon * 100)],
    queryFn: () => fetchForecastDetail(lat, lon),
    staleTime: 15 * 60_000,
    refetchInterval: 15 * 60_000,
  });
}
