"use client";

import { useState } from "react";
import { Plus, Trash2, Ship } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useBoatStore } from "@/stores/boatStore";
import { useT } from "@/lib/i18n";
import type { BoatType } from "@/types";

export default function BoatsPage() {
  const t = useT();
  const { boats, load } = useBoatStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    boat_type: "motorboat" as BoatType,
    manufacturer: "",
    model: "",
    year: "",
    engine_type: "",
    fuel_capacity: "",
    cruise_speed: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("boats").insert({
      user_id: user.id,
      name: form.name,
      boat_type: form.boat_type,
      manufacturer: form.manufacturer || null,
      model: form.model || null,
      year: form.year ? Number(form.year) : null,
      engine_type: form.engine_type || null,
      fuel_capacity_liters: form.fuel_capacity ? Number(form.fuel_capacity) : null,
      cruise_speed_knots: form.cruise_speed ? Number(form.cruise_speed) : null,
      notes: form.notes || null,
      is_primary: boats.length === 0,
    });
    setShowForm(false);
    void load();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("boats").delete().eq("id", id);
    void load();
  }

  return (
    <div>
      <PageHeader
        title={t("boats.title")}
        action={
          <button className="btn-primary !px-4 !py-2 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> {t("boats.addBoat")}
          </button>
        }
      />

      {showForm ? (
        <div className="holo-panel mb-4 flex flex-col gap-3 p-4">
          <input className="input-field" placeholder={t("onboarding.boatName")} value={form.name} onChange={set("name")} />
          <select className="input-field" value={form.boat_type} onChange={set("boat_type")}>
            <option value="motorboat">{t("onboarding.motorboat")}</option>
            <option value="sailboat">{t("onboarding.sailboat")}</option>
            <option value="fishing_boat">{t("onboarding.fishingBoat")}</option>
            <option value="pwc">{t("onboarding.pwc")}</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" placeholder={t("onboarding.manufacturer")} value={form.manufacturer} onChange={set("manufacturer")} />
            <input className="input-field" placeholder={t("onboarding.model")} value={form.model} onChange={set("model")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" inputMode="numeric" placeholder={t("onboarding.year")} value={form.year} onChange={set("year")} />
            <input className="input-field" placeholder={t("boats.engineType")} value={form.engine_type} onChange={set("engine_type")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" inputMode="numeric" placeholder={t("onboarding.fuelCapacity")} value={form.fuel_capacity} onChange={set("fuel_capacity")} />
            <input className="input-field" inputMode="numeric" placeholder={t("onboarding.cruiseSpeed")} value={form.cruise_speed} onChange={set("cruise_speed")} />
          </div>
          <input className="input-field" placeholder={t("boats.notes")} value={form.notes} onChange={set("notes")} />
          <button className="btn-primary" onClick={save} disabled={!form.name}>
            {t("common.save")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {boats.length === 0 ? (
          <EmptyState text={t("boats.noBoats")} />
        ) : (
          boats.map((b) => (
            <div key={b.id} className={b.is_primary ? "holo-panel p-4" : "glass-card p-4"}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Ship size={20} className="text-sonar" strokeWidth={1.6} />
                  <div>
                    <p className="font-display font-semibold">{b.name}</p>
                    <p className="text-xs text-mist">
                      {b.manufacturer} {b.model} {b.year ? `· ${b.year}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => remove(b.id)} aria-label={t("common.delete")}>
                  <Trash2 size={16} className="text-mist hover:text-risk-red" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-mist">
                {b.fuel_capacity_liters ? <span>⛽ {b.fuel_capacity_liters} L</span> : null}
                {b.cruise_speed_knots ? <span>⚓ {b.cruise_speed_knots} kn</span> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
