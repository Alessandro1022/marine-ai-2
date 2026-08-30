import { create } from "zustand";

export type MapMode = "explore" | "route" | "measure" | "anchor";

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapState {
  mode: MapMode;
  setMode: (m: MapMode) => void;
  // Layer toggles
  showSeamarks: boolean;
  showMarinas: boolean;
  showProtected: boolean;
  showAIS: boolean;
  darkBase: boolean;
  toggle: (k: "showSeamarks" | "showMarinas" | "showProtected" | "showAIS" | "darkBase") => void;
  // Route mode
  routeStart: LatLng | null;
  routeEnd: LatLng | null;
  setRoutePoint: (p: LatLng) => void;
  clearRoute: () => void;
  // Measure mode
  measurePoints: LatLng[];
  addMeasurePoint: (p: LatLng) => void;
  clearMeasure: () => void;
  // Anchor watch
  anchor: (LatLng & { radiusM: number }) | null;
  setAnchor: (a: (LatLng & { radiusM: number }) | null) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  mode: "explore",
  setMode: (mode) => set({ mode }),
  showSeamarks: true,
  showMarinas: true,
  showProtected: true,
  showAIS: true,
  darkBase: true, // dark is now the default base map
  toggle: (k) => set({ [k]: !get()[k] } as Partial<MapState>),
  routeStart: null,
  routeEnd: null,
  setRoutePoint: (p) => {
    const { routeStart, routeEnd } = get();
    if (!routeStart || (routeStart && routeEnd)) {
      set({ routeStart: p, routeEnd: null });
    } else {
      set({ routeEnd: p });
    }
  },
  clearRoute: () => set({ routeStart: null, routeEnd: null }),
  measurePoints: [],
  addMeasurePoint: (p) =>
    set({ measurePoints: [...get().measurePoints, p].slice(-12) }),
  clearMeasure: () => set({ measurePoints: [] }),
  anchor: null,
  setAnchor: (anchor) => set({ anchor }),
}));
