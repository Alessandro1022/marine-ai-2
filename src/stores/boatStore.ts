import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Boat } from "@/types";

interface BoatState {
  boats: Boat[];
  loaded: boolean;
  load: () => Promise<void>;
  primaryBoat: () => Boat | null;
}

export const useBoatStore = create<BoatState>((set, get) => ({
  boats: [],
  loaded: false,

  load: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("boats")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at");
    set({ boats: (data as Boat[]) ?? [], loaded: true });
  },

  primaryBoat: () => {
    const boats = get().boats;
    return boats.find((b) => b.is_primary) ?? boats[0] ?? null;
  },
}));
