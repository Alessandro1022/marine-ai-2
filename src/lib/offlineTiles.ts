"use client";

import L from "leaflet";

const CACHE_NAME = "marivo-map-tiles-v1";

// A TileLayer that transparently caches every tile it successfully loads
// (Cache Storage API), and serves from that cache first — so tiles you've
// already panned over keep working with no connection. No service worker
// needed; Cache Storage is readable/writable directly from page scripts.
export function createOfflineTileLayer(
  urlTemplate: string,
  options: L.TileLayerOptions
) {
  const OfflineTileLayer = L.TileLayer.extend({
    createTile(coords: L.Coords, done: (error: Error | null, tile: HTMLElement) => void) {
      const tile = document.createElement("img");
      const url = (this as any).getTileUrl(coords);

      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(url);

          if (cached) {
            const blob = await cached.blob();
            tile.src = URL.createObjectURL(blob);
            done(null, tile);
            return;
          }

          const res = await fetch(url);
          if (!res.ok) throw new Error(`tile fetch failed: ${res.status}`);
          // Cache a clone before consuming the body for display.
          void cache.put(url, res.clone());
          const blob = await res.blob();
          tile.src = URL.createObjectURL(blob);
          done(null, tile);
        } catch (err) {
          // Offline and not cached — leave tile blank rather than erroring
          // the whole layer, so the rest of the map keeps working.
          done(err as Error, tile);
        }
      })();

      return tile;
    },
  });

  return new (OfflineTileLayer as any)(urlTemplate, options);
}

// Optional: check how much tile data is cached, and let the user clear it
// from a settings screen (cached tiles otherwise grow unbounded).
export async function getTileCacheSize(): Promise<number> {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  return keys.length;
}

export async function clearTileCache(): Promise<void> {
  await caches.delete(CACHE_NAME);
}
