"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Wrench } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { MaintenanceItem, MaintenanceType } from "@/types";

const TYPES: { id: MaintenanceType; key: string }[] = [
  { id: "oil_change", key: "maintenance.oilChange" },
  { id: "engine_service", key: "maintenance.engineService" },
  { id: "battery_replacement", key: "maintenance.batteryReplacement" },
  { id: "impeller_replacement", key: "maintenance.impellerReplacement" },
  { id: "hull_cleaning", key: "maintenance.hullCleaning" },
  { id: "winter_storage", key: "maintenance.winterStorage" },
];

export default function MaintenancePage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<MaintenanceType>("oil_change");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: items } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("maintenance")
        .select("*")
        .order("completed_at", { ascending: true, nullsFirst: true })
        .order("due_date", { ascending: true });
      return (data as MaintenanceItem[]) ?? [];
    },
  });

  async function save() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const typeDef = TYPES.find((x) => x.id === type)!;
    await supabase.from("maintenance").insert({
      user_id: user.id,
      maintenance_type: type,
      title: t(typeDef.key),
      due_date: dueDate || null,
      notes: notes || null,
    });
    setShowForm(false);
    setDueDate("");
    setNotes("");
    void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
  }

  async function complete(id: string) {
    const supabase = createClient();
    await supabase.from("maintenance").update({ completed_at: new Date().toISOString() }).eq("id", id);
    void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
  }

  const open = (items ?? []).filter((i) => !i.completed_at);
  const done = (items ?? []).filter((i) => i.completed_at);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title={t("maintenance.title")}
        action={
          <button className="btn-primary !px-4 !py-2 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> {t("maintenance.addMaintenance")}
          </button>
        }
      />

      {showForm ? (
        <div className="holo-panel mb-4 flex flex-col gap-3 p-4">
          <select className="input-field" value={type} onChange={(e) => setType(e.target.value as MaintenanceType)}>
            {TYPES.map((x) => (
              <option key={x.id} value={x.id}>{t(x.key)}</option>
            ))}
          </select>
          <input className="input-field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label={t("maintenance.dueDate")} />
          <input className="input-field" placeholder={t("boats.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn-primary" onClick={save}>{t("common.save")}</button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {open.length === 0 ? <EmptyState text={t("common.empty")} /> : null}
        {open.map((i) => {
          const overdue = i.due_date && i.due_date < today;
          return (
            <div key={i.id} className="glass-card flex items-center gap-3 p-4">
              <Wrench size={18} className={overdue ? "text-risk-red" : "text-risk-yellow"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{i.title}</p>
                <p className={`text-xs ${overdue ? "text-risk-red" : "text-mist"}`}>
                  {i.due_date ?? "—"} {overdue ? `· ${t("maintenance.overdue")}` : ""}
                </p>
              </div>
              <button onClick={() => complete(i.id)} aria-label={t("common.done")}>
                <CheckCircle2 size={20} className="text-mist hover:text-sonar" />
              </button>
            </div>
          );
        })}

        {done.length > 0 ? (
          <>
            <span className="instrument-label mt-2">{t("maintenance.history")}</span>
            {done.map((i) => (
              <div key={i.id} className="glass-card flex items-center gap-3 p-4 opacity-60">
                <CheckCircle2 size={18} className="text-sonar" />
                <div className="flex-1">
                  <p className="text-sm">{i.title}</p>
                  <p className="text-xs text-mist">{i.completed_at?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
