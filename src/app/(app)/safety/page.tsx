"use client";

import { useState } from "react";
import { ShieldAlert, Phone, CheckSquare, Square } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useBoatStore } from "@/stores/boatStore";
import { useT } from "@/lib/i18n";

const CHECKLIST_KEYS = [
  "safety.check1",
  "safety.check2",
  "safety.check3",
  "safety.check4",
  "safety.check5",
  "safety.check6",
];

export default function SafetyPage() {
  const t = useT();
  const { lat, lon } = useGeolocation();
  const { data: weather } = useWeather(lat, lon);
  const boat = useBoatStore((s) => s.primaryBoat());
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const warnings: { text: string; level: "yellow" | "red" }[] = [];
  if (weather?.risk === "red") warnings.push({ text: t("home.riskRed"), level: "red" });
  if (weather?.risk === "yellow") warnings.push({ text: t("home.riskYellow"), level: "yellow" });
  if (boat && boat.fuel_level_percent < 25)
    warnings.push({ text: t("safety.lowFuel"), level: "yellow" });

  return (
    <div>
      <PageHeader title={t("safety.title")} />

      {warnings.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2.5">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`glass-card flex items-center gap-3 p-4 ${
                w.level === "red" ? "border-risk-red/50" : "border-risk-yellow/50"
              }`}
            >
              <ShieldAlert size={18} className={w.level === "red" ? "text-risk-red" : "text-risk-yellow"} />
              <p className="text-sm">{w.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* SOS */}
      <section className="holo-panel p-5">
        <span className="instrument-label">{t("safety.sos")}</span>
        <a href="tel:112" className="mt-3 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-risk-red/15 text-risk-red animate-pulse-sonar">
            <Phone size={20} />
          </span>
          <div>
            <p className="instrument text-2xl text-risk-red">112</p>
            <p className="text-xs text-mist">{t("safety.sosNumber")}</p>
          </div>
        </a>
      </section>

      {/* Emergency checklist */}
      <section className="mt-4">
        <span className="instrument-label">{t("safety.emergencyChecklist")}</span>
        <div className="mt-2 flex flex-col gap-2">
          {CHECKLIST_KEYS.map((key) => (
            <button key={key} onClick={() => toggle(key)} className="glass-card flex items-center gap-3 p-3.5 text-left">
              {checked.has(key) ? (
                <CheckSquare size={18} className="shrink-0 text-sonar" />
              ) : (
                <Square size={18} className="shrink-0 text-mist" />
              )}
              <span className={`text-sm ${checked.has(key) ? "text-mist line-through" : ""}`}>{t(key)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section className="mt-4">
        <span className="instrument-label">{t("safety.emergencyContacts")}</span>
        <div className="mt-2 flex flex-col gap-2">
          <Contact name={t("safety.contactJrcc")} number="112" />
          <Contact name={t("safety.contactSsrs")} number="077-579 00 90" />
          <Contact name={t("safety.contactVhf")} number="VHF 16" />
        </div>
      </section>
    </div>
  );
}

function Contact({ name, number }: { name: string; number: string }) {
  return (
    <div className="glass-card flex items-center justify-between p-3.5">
      <span className="text-sm">{name}</span>
      <span className="instrument text-sm text-sonar">{number}</span>
    </div>
  );
}
