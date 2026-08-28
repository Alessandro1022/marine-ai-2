"use client";

import { useEffect, useRef, useState } from "react";
import { Cable, Radio, Wifi } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SignalKClient, INTEGRATION_PROVIDERS, type Telemetry } from "@/lib/services/signalk";
import { useT } from "@/lib/i18n";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

export default function IntegrationsPage() {
  const t = useT();
  const [host, setHost] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const clientRef = useRef<SignalKClient | null>(null);

  useEffect(() => {
    clientRef.current = new SignalKClient();
    return () => clientRef.current?.disconnect();
  }, []);

  function connect() {
    if (!host) return;
    clientRef.current?.connect(host, setTelemetry, (s) => setStatus(s));
  }

  const statusColor =
    status === "open" ? "text-risk-green" : status === "connecting" ? "text-risk-yellow" : "text-mist";

  return (
    <div>
      <PageHeader title={t("integrations.title")} subtitle={t("integrations.subtitle")} />

      {/* Connect to gateway */}
      <section className="holo-panel p-4">
        <div className="flex items-center gap-2">
          <Wifi size={15} className="text-sonar" />
          <span className="instrument-label">{t("integrations.gateway")}</span>
          <span className={`instrument-label ml-auto ${statusColor}`}>
            {t(`integrations.status_${status}`)}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="192.168.4.1:3000"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <button className="btn-primary !px-4" onClick={connect} disabled={!host}>
            <Cable size={16} />
          </button>
        </div>
        <p className="mt-2.5 text-[0.7rem] leading-relaxed text-mist/80">
          {t("integrations.note")}
        </p>
      </section>

      {/* Live telemetry */}
      {telemetry ? (
        <section className="holo-panel mt-4 p-5">
          <div className="flex items-center gap-2">
            <Radio size={15} className="animate-pulse text-sonar" />
            <span className="instrument-label">{t("integrations.liveTelemetry")}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Readout value={fmt(telemetry.speedOverGroundKn, 1)} label="SOG kn" />
            <Readout value={fmt(telemetry.courseOverGroundDeg, 0, "°")} label="COG" />
            <Readout value={fmt(telemetry.depthM, 1, " m")} label={t("integrations.depth")} />
            <Readout value={fmt(telemetry.windSpeedApparentMs, 1, " m/s")} label={t("integrations.windApparent")} />
          </div>
        </section>
      ) : null}

      {/* Supported ecosystems */}
      <span className="instrument-label mt-5 block">{t("integrations.supported")}</span>
      <div className="mt-2 flex flex-col gap-2">
        {INTEGRATION_PROVIDERS.map((p) => (
          <div key={p.id} className="glass-card flex items-center justify-between p-3.5">
            <span className="font-display text-sm font-semibold">{p.name}</span>
            <span className="text-[0.68rem] text-mist">{p.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmt(v: number | null, decimals: number, suffix = "") {
  return v === null ? "–" : `${v.toFixed(decimals)}${suffix}`;
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="instrument text-2xl text-sonar glow-text">{value}</p>
      <p className="instrument-label mt-1">{label}</p>
    </div>
  );
}
