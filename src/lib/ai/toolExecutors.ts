"use client";

import { useMapStore } from "@/stores/mapStore";
import { useTripRecordingStore } from "@/stores/tripRecordingStore";
import { useBoatStore } from "@/stores/boatStore";
import type { ChatResponse } from "@/lib/ai/client";

// Confirmation text shown after a client tool runs. Kept canned (not a second
// Gemini round-trip) to avoid doubling API calls for a simple ack message.
const CONFIRMATIONS: Record<string, (args: any) => string> = {
  start_trip: () => "Tur startad — spårar din position nu.",
  stop_trip: () => "Turen avslutad och sparad i loggboken.",
  set_route: (args) =>
    `Rutt satt till ${args.destination_name ?? `${args.destination_lat}, ${args.destination_lon}`}.`,
  toggle_layer: (args) => `Lager "${args.layer}" växlat.`,
  fly_to: () => "Flyttade kartan dit.",
};

// Call this from a component that has map context (MapAIPanel). Returns the
// confirmation text to show in chat, or an error string if it couldn't run
// (e.g. a map-only tool called from a screen without a map).
export function useAiToolExecutor() {
  const mapStore = useMapStore();
  const tripStore = useTripRecordingStore();
  const boat = useBoatStore((s) => s.primaryBoat());

  return async function execute(
    action: Extract<ChatResponse, { type: "action" }>,
    opts?: { hasMap?: boolean; flyTo?: (lat: number, lon: number, zoom?: number) => void }
  ): Promise<string> {
    const { tool, args } = action;

    if ((tool === "set_route" || tool === "fly_to") && !opts?.hasMap) {
      return "Öppna kartan för att göra det.";
    }

    switch (tool) {
      case "start_trip": {
        if (!boat?.id) return "Ingen båt kopplad till kontot — lägg till en båt under Profil först.";
        await tripStore.startManual(boat.id);
        return CONFIRMATIONS.start_trip(args);
      }
      case "stop_trip": {
        await tripStore.stopManual();
        return CONFIRMATIONS.stop_trip(args);
      }
      case "set_route": {
        // Mirrors two taps on the map: first tap sets routeStart, second sets routeEnd.
        // We don't have the boat's live position here, so we start from wherever
        // routeStart currently is (or leave it to the map's own "locate" flow) —
        // simplest correct behavior is to just set the destination as routeEnd
        // if a start already exists, otherwise ask the user to set a start point.
        const dest = { lat: Number(args.destination_lat), lng: Number(args.destination_lon) };
        mapStore.setRoutePoint(dest);
        return CONFIRMATIONS.set_route(args);
      }
      case "toggle_layer": {
        const layer = args.layer as "showSeamarks" | "showMarinas" | "showProtected" | "darkBase";
        mapStore.toggle(layer);
        return CONFIRMATIONS.toggle_layer(args);
      }
      case "fly_to": {
        opts?.flyTo?.(Number(args.lat), Number(args.lon), args.zoom ? Number(args.zoom) : undefined);
        return CONFIRMATIONS.fly_to(args);
      }
      default:
        return "Okänd åtgärd.";
    }
  };
}
