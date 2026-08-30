"use client";

import { useEffect, useRef, useState } from "react";

export interface AisVessel {
  mmsi: number;
  lat: number;
  lon: number;
  sogKn: number | null;
  cogDeg: number | null;
  shipName?: string;
  lastUpdate: number; // epoch ms
}

const STALE_MS = 5 * 60_000; // drop a vessel if no update for 5 min
const PRUNE_INTERVAL_MS = 30_000;

// Opens a WebSocket directly from the browser to aisstream.io, subscribed to
// the given bounding box. Reconnects on close/error with backoff. Bounds
// changes (e.g. panning the map) send a fresh subscription over the same
// socket rather than reconnecting, to avoid connection-limit churn.
export function useAisVessels(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
} | null) {
  const [vessels, setVessels] = useState<Map<number, AisVessel>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY;
    if (!key || !bounds) return;

    let closedByUs = false;

    function connect() {
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      wsRef.current = ws;

      ws.onopen = () => {
        const b = boundsRef.current;
        if (!b) return;
        ws.send(
          JSON.stringify({
            APIKey: key,
            BoundingBoxes: [
              [
                [b.south, b.west],
                [b.north, b.east],
              ],
            ],
            FilterMessageTypes: ["PositionReport", "ShipStaticData"],
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const mmsi = msg?.MetaData?.MMSI;
          if (!mmsi) return;

          if (msg.MessageType === "PositionReport") {
            const pr = msg.Message?.PositionReport;
            if (!pr) return;
            setVessels((prev) => {
              const next = new Map(prev);
              const existing = next.get(mmsi);
              next.set(mmsi, {
                mmsi,
                lat: pr.Latitude,
                lon: pr.Longitude,
                sogKn: pr.Sog ?? null,
                cogDeg: pr.Cog ?? null,
                shipName: existing?.shipName ?? msg?.MetaData?.ShipName?.trim(),
                lastUpdate: Date.now(),
              });
              return next;
            });
          } else if (msg.MessageType === "ShipStaticData") {
            const name = msg.Message?.ShipStaticData?.Name?.trim();
            if (!name) return;
            setVessels((prev) => {
              const existing = prev.get(mmsi);
              if (!existing) return prev;
              const next = new Map(prev);
              next.set(mmsi, { ...existing, shipName: name });
              return next;
            });
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (closedByUs) return;
        reconnectTimer.current = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds?.north, bounds?.south, bounds?.east, bounds?.west]);

  // Prune stale vessels periodically
  useEffect(() => {
    const id = setInterval(() => {
      setVessels((prev) => {
        const now = Date.now();
        let changed = false;
        const next = new Map(prev);
        for (const [mmsi, v] of prev) {
          if (now - v.lastUpdate > STALE_MS) {
            next.delete(mmsi);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, PRUNE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return Array.from(vessels.values());
}
