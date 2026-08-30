"use client";

import { useEffect, useRef, useState } from "react";

export interface AisVessel {
  mmsi: number;
  lat: number;
  lon: number;
  sogKn: number | null;
  cogDeg: number | null;
  shipName?: string;
  lastUpdate: number;
}

const STALE_MS = 5 * 60_000;
const PRUNE_INTERVAL_MS = 30_000;
const SUBSCRIBE_DEBOUNCE_MS = 800;

export function useAisVessels(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
} | null) {
  const [vessels, setVessels] = useState<Map<number, AisVessel>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  function sendSubscription() {
    const ws = wsRef.current;
    const b = boundsRef.current;
    const key = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY;
    if (!ws || ws.readyState !== WebSocket.OPEN || !b || !key) return;
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
  }

  // Connect ONCE (and on genuine disconnects). Bounds changes below just
  // resend a subscription message on the same open socket — per aisstream's
  // own docs this replaces the previous subscription without reconnecting.
  // Tearing down/reopening the socket on every pan (the previous bug here)
  // caused a reconnect storm that never let any data settle.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY;
    if (!key) return;
    let closedByUs = false;

    function connect() {
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      wsRef.current = ws;

      ws.onopen = () => sendSubscription();

      ws.onmessage = async (event) => {
        let text: string;
        if (typeof event.data === "string") {
          text = event.data;
        } else if (event.data instanceof Blob) {
          text = await event.data.text();
        } else if (event.data instanceof ArrayBuffer) {
          text = new TextDecoder().decode(event.data);
        } else {
          return;
        }

        try {
          const msg = JSON.parse(text);
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
      if (subscribeDebounce.current) clearTimeout(subscribeDebounce.current);
      wsRef.current?.close();
    };
    // Intentionally NOT depending on bounds — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bounds changed: debounce, then resend subscription on the existing socket.
  useEffect(() => {
    if (!bounds) return;
    if (subscribeDebounce.current) clearTimeout(subscribeDebounce.current);
    subscribeDebounce.current = setTimeout(sendSubscription, SUBSCRIBE_DEBOUNCE_MS);
    return () => {
      if (subscribeDebounce.current) clearTimeout(subscribeDebounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds?.north, bounds?.south, bounds?.east, bounds?.west]);

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
