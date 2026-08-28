import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  initialized: boolean;
  init: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    set({ user, initialized: true });
    if (user) await get().refreshProfile();

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
      if (session?.user) {
        void get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  refreshProfile: async () => {
    const supabase = createClient();
    const user = get().user;
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    set({ profile: (data as Profile) ?? null });
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
