"use client";

import { useState } from "react";
import { Heart, Fuel, Utensils, Zap, Droplets, Wifi, Anchor } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { Marina } from "@/types";

export default function MarinasPage() {
  const t = useT();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: marinas } = useQuery({
    queryKey: ["marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("marinas").select("*").order("name");
      return (data as Marina[]) ?? [];
    },
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorite_marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("favorite_marinas").select("marina_id");
      return new Set((data ?? []).map((f) => f.marina_id as string));
    },
  });

  async function toggleFavorite(marinaId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (favorites?.has(marinaId)) {
      await supabase.from("favorite_marinas").delete().eq("marina_id", marinaId).eq("user_id", user.id);
    } else {
      await supabase.from("favorite_marinas").insert({ user_id: user.id, marina_id: marinaId });
    }
    void queryClient.invalidateQueries({ queryKey: ["favorite_marinas"] });
  }

  const filtered = (marinas ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.region ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title={t("marinas.title")} />
      <input
        className="input-field mb-4"
        placeholder={t("common.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState text={t("common.empty")} />
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold">{m.name}</p>
                  <p className="text-xs text-mist">{m.region}</p>
                </div>
                <button onClick={() => toggleFavorite(m.id)} aria-label="Favorite">
                  <Heart
                    size={18}
                    className={favorites?.has(m.id) ? "fill-sonar text-sonar" : "text-mist"}
                  />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.has_fuel ? <Tag icon={Fuel} label={t("marinas.fuel")} /> : null}
                {m.has_restaurant ? <Tag icon={Utensils} label={t("marinas.restaurant")} /> : null}
                {m.has_electricity ? <Tag icon={Zap} label={t("marinas.electricity")} /> : null}
                {m.is_guest_harbor ? <Tag icon={Anchor} label={t("marinas.guestHarbor")} /> : null}
                {m.has_water ? <Tag icon={Droplets} label={t("marinas.water")} /> : null}
                {m.has_wifi ? <Tag icon={Wifi} label={t("marinas.wifi")} /> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Tag({ icon: Icon, label }: { icon: typeof Fuel; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-sonar/20 bg-sonar/5 px-2.5 py-1 text-[0.65rem] text-sonar">
      <Icon size={11} /> {label}
    </span>
  );
}
