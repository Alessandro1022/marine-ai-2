import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface SettingsState {
  fuelPriceSek: number;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  fuelPriceSek: 25,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const supabase = createClient();
    const { data } = await supabase.from("settings").select("*").maybeSingle();
    if (data) set({ fuelPriceSek: Number(data.fuel_price_sek_per_liter) || 25 });
    set({ loaded: true });
  },
}));
