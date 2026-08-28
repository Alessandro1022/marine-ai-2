"use client";

import { useEffect } from "react";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { useAuthStore } from "@/stores/authStore";
import { useBoatStore } from "@/stores/boatStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.init);
  const loadBoats = useBoatStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    void initAuth();
    void loadBoats();
    void loadSettings();
  }, [initAuth, loadBoats, loadSettings]);

  return (
    <div className="min-h-dvh">
      {/* Background grid lives in its own fixed layer so it can never
          affect positioning of other fixed elements (the tab bar). */}
      <div className="holo-grid pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <main className="mx-auto max-w-md px-5 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
