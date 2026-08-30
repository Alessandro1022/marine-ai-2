"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { Trip } from "@/types";

export default function LogbookPage() {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    start: "",
    destination: "",
    distance: "",
    duration: "",
    fuel: "",
    notes: "",
  });

  const { data: trips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("trips").select("*").order("trip_date", { ascending: false });
      return (data as Trip[]) ?? [];
    },
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("trips").insert({
      user_id: user.id,
      trip_date: form.date,
      start_location: form.start,
      destination: form.destination,
      distance_nm: form.distance ? Number(form.distance) : null,
      duration_minutes: form.duration ? Number(form.duration) : null,
      fuel_used_liters: form.fuel ? Number(form.fuel) : null,
      notes: form.notes || null,
    });
    setShowForm(false);
    setForm({ ...form, start: "", destination: "", distance: "", duration: "", fuel: "", notes: "" });
    void queryClient.invalidateQueries({ queryKey: ["trips"] });
  }

  const filtered = (trips ?? []).filter(
    (tr) =>
      tr.start_location.toLowerCase().includes(search.toLowerCase()) ||
      tr.destination.toLowerCase().includes(search.toLowerCase())
  );

  const totalNm = filtered.reduce((sum, tr) => sum + (Number(tr.distance_nm) || 0), 0);
  const totalFuel = filtered.reduce((sum, tr) => sum + (Number(tr.fuel_used_liters) || 0), 0);

  return (
    <div>
      <PageHeader
        title={t("logbook.title")}
        action={
          <button className="btn-primary !px-4 !py-2 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> {t("logbook.addTrip")}
          </button>
        }
      />

      {showForm ? (
        <div className="holo-panel mb-4 flex flex-col gap-3 p-4">
          <input className="input-field" type="date" value={form.date} onChange={set("date")} />
          <input className="input-field" placeholder={t("logbook.startLocation")} value={form.start} onChange={set("start")} />
          <input className="input-field" placeholder={t("logbook.destination")} value={form.destination} onChange={set("destination")} />
          <div className="grid grid-cols-3 gap-3">
            <input className="input-field" inputMode="decimal" placeholder="nm" value={form.distance} onChange={set("distance")} />
            <input className="input-field" inputMode="numeric" placeholder="min" value={form.duration} onChange={set("duration")} />
            <input className="input-field" inputMode="decimal" placeholder="L" value={form.fuel} onChange={set("fuel")} />
          </div>
          <input className="input-field" placeholder={t("boats.notes")} value={form.notes} onChange={set("notes")} />
          <button className="btn-primary" onClick={save} disabled={!form.start || !form.destination}>
            {t("common.save")}
          </button>
        </div>
      ) : null}

      <input className="input-field mb-4" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Statistics */}
      <section className="glass-card mb-4 grid grid-cols-3 gap-3 p-4">
        <Stat value={String(filtered.length)} label={t("logbook.title")} />
        <Stat value={`${Math.round(totalNm)} nm`} label={t("logbook.distance")} />
        <Stat value={`${Math.round(totalFuel)} L`} label={t("logbook.fuelUsed")} />
      </section>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState text={t("logbook.noTrips")} />
        ) : (
          filtered.map((tr) => (
            <button
              key={tr.id}
              onClick={() => router.push(`/logbook/${tr.id}`)}
              className="glass-card w-full p-4 text-left transition-opacity active:opacity-70"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold">
                  {tr.start_location} → {tr.destination}
                </p>
                <span className="instrument-label">{tr.trip_date}</span>
              </div>
              <p className="mt-1.5 text-xs text-mist">
                {tr.distance_nm ? `${tr.distance_nm} nm` : ""}
                {tr.duration_minutes ? ` · ${tr.duration_minutes} min` : ""}
                {tr.fuel_used_liters ? ` · ${tr.fuel_used_liters} L` : ""}
              </p>
              {tr.notes ? <p className="mt-1.5 text-xs text-mist/80">{tr.notes}</p> : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="instrument text-lg">{value}</p>
      <p className="instrument-label mt-0.5">{label}</p>
    </div>
  );
}
