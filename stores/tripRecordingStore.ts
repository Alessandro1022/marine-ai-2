import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

// Tune these against real on-water testing — they're a starting point.
const START_THRESHOLD_KN = 1.0;
const START_HOLD_MS = 30_000; // sustained speed before auto-start fires
const STOP_THRESHOLD_KN = 0.3;
const STOP_HOLD_MS = 5 * 60_000; // sustained stillness before auto-stop fires
const FLUSH_EVERY_N_POINTS = 5; // batch writes instead of one insert per GPS fix

export interface RecordedFix {
  lat: number;
  lon: number;
  sogKn: number | null;
  cogDeg: number | null;
}

interface PendingPoint extends RecordedFix {
  recordedAt: string;
}

interface TripRecordingState {
  isRecording: boolean;
  source: "manual" | "auto" | null;
  manualLock: boolean; // true after a manual start — blocks auto-stop
  tripId: string | null;
  startedAt: string | null;
  pointBuffer: PendingPoint[];
  distanceNm: number;
  lastPoint: PendingPoint | null;

  // internal hysteresis timers — epoch ms of when the condition first became true
  aboveStartThresholdSince: number | null;
  belowStopThresholdSince: number | null;

  startManual: (boatId: string) => Promise<void>;
  stopManual: () => Promise<void>;
  ingestFix: (fix: RecordedFix, boatId: string) => void;
}

function haversineNm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R_NM = 3440.065;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.sqrt(h));
}

async function createTripRow(boatId: string, source: "manual" | "auto") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      boat_id: boatId,
      trip_date: nowIso.slice(0, 10),
      start_location: "",
      destination: "",
      source,
      started_at: nowIso,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.warn("Failed to create trip row", error);
    return null;
  }
  return data.id as string;
}

async function finalizeTripRow(
  tripId: string,
  distanceNm: number,
  startedAt: string
) {
  const supabase = createClient();
  const endedAt = new Date().toISOString();
  const durationMinutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000
  );
  await supabase
    .from("trips")
    .update({
      ended_at: endedAt,
      distance_nm: Math.round(distanceNm * 10) / 10,
      duration_minutes: durationMinutes,
    })
    .eq("id", tripId);
}

async function flushPoints(tripId: string, points: PendingPoint[]) {
  if (points.length === 0) return;
  const supabase = createClient();
  await supabase.from("trip_points").insert(
    points.map((p) => ({
      trip_id: tripId,
      lat: p.lat,
      lon: p.lon,
      sog_kn: p.sogKn,
      cog_deg: p.cogDeg,
      recorded_at: p.recordedAt,
    }))
  );
}

export const useTripRecordingStore = create<TripRecordingState>((set, get) => ({
  isRecording: false,
  source: null,
  manualLock: false,
  tripId: null,
  startedAt: null,
  pointBuffer: [],
  distanceNm: 0,
  lastPoint: null,
  aboveStartThresholdSince: null,
  belowStopThresholdSince: null,

  startManual: async (boatId) => {
    if (get().isRecording) return;
    const tripId = await createTripRow(boatId, "manual");
    if (!tripId) return;
    set({
      isRecording: true,
      source: "manual",
      manualLock: true,
      tripId,
      startedAt: new Date().toISOString(),
      pointBuffer: [],
      distanceNm: 0,
      lastPoint: null,
      aboveStartThresholdSince: null,
      belowStopThresholdSince: null,
    });
  },

  stopManual: async () => {
    const { isRecording, tripId, pointBuffer, distanceNm, startedAt } = get();
    if (!isRecording || !tripId || !startedAt) return;
    await flushPoints(tripId, pointBuffer);
    await finalizeTripRow(tripId, distanceNm, startedAt);
    set({
      isRecording: false,
      source: null,
      manualLock: false,
      tripId: null,
      startedAt: null,
      pointBuffer: [],
      distanceNm: 0,
      lastPoint: null,
      aboveStartThresholdSince: null,
      belowStopThresholdSince: null,
    });
  },

  // Call this on every GPS fix (e.g. from MarineMap's onFix). Cheap — only
  // touches the network when a batch is ready to flush or a trip boundary fires.
  ingestFix: (fix, boatId) => {
    const now = Date.now();
    const state = get();
    const sog = fix.sogKn ?? 0;

    // --- Auto-start detection (only when not already recording) ---
    if (!state.isRecording) {
      if (sog > START_THRESHOLD_KN) {
        const since = state.aboveStartThresholdSince ?? now;
        set({ aboveStartThresholdSince: since });
        if (now - since >= START_HOLD_MS) {
          set({ aboveStartThresholdSince: null });
          void (async () => {
            const tripId = await createTripRow(boatId, "auto");
            if (!tripId) return;
            set({
              isRecording: true,
              source: "auto",
              manualLock: false,
              tripId,
              startedAt: new Date().toISOString(),
              pointBuffer: [],
              distanceNm: 0,
              lastPoint: null,
            });
          })();
        }
      } else {
        set({ aboveStartThresholdSince: null });
      }
      return; // not recording yet — nothing to buffer
    }

    // --- Recording: buffer the point, update running distance ---
    const point: PendingPoint = {
      lat: fix.lat,
      lon: fix.lon,
      sogKn: fix.sogKn,
      cogDeg: fix.cogDeg,
      recordedAt: new Date(now).toISOString(),
    };
    const addedDistance = state.lastPoint ? haversineNm(state.lastPoint, point) : 0;
    const newBuffer = [...state.pointBuffer, point];

    set({
      pointBuffer:
        newBuffer.length >= FLUSH_EVERY_N_POINTS ? [] : newBuffer,
      lastPoint: point,
      distanceNm: state.distanceNm + addedDistance,
    });

    if (newBuffer.length >= FLUSH_EVERY_N_POINTS && state.tripId) {
      void flushPoints(state.tripId, newBuffer);
    }

    // --- Auto-stop detection (skipped entirely if manually locked) ---
    if (state.manualLock) return;

    if (sog < STOP_THRESHOLD_KN) {
      const since = state.belowStopThresholdSince ?? now;
      set({ belowStopThresholdSince: since });
      if (now - since >= STOP_HOLD_MS) {
        set({ belowStopThresholdSince: null });
        void get().stopManual(); // same finalize path as a manual stop
      }
    } else {
      set({ belowStopThresholdSince: null });
    }
  },
}));
