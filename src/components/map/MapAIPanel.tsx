"use client";

import { useState } from "react";
import { Sparkles, Leaf, X } from "lucide-react";
import { streamChat } from "@/lib/ai/client";
import { useI18n } from "@/lib/i18n";
import { ecoScore, type RouteEcoHit } from "@/lib/services/ecoService";

/**
 * Bottom sheet where the AI "reads" the chart: area briefing in explore
 * mode, environmental route analysis in route mode.
 */
export function MapAIPanel({
  chartContext,
  routeActive,
  hits,
  onClose,
}: {
  chartContext: string;
  routeActive: boolean;
  hits: RouteEcoHit[];
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(kind: "briefing" | "eco") {
    if (busy) return;
    setBusy(true);
    setText("");
    const prompt =
      kind === "eco"
        ? "Act as an environmental marine navigator. Analyze my planned route: which protected areas it crosses or passes, what restrictions apply right now, recommended passing distance and speed, and suggest a more eco-friendly adjustment (heading offsets are fine). Be specific and practical, max 130 words."
        : "Act as a sea chart analyst. Read the chart context and give me a practical area briefing: depths/bathymetry character, navigational caution points, protected areas to respect, best marina options, and one local tip. Max 130 words.";
    let acc = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: prompt }],
        locale,
        context: chartContext,
        onChunk: (c) => {
          acc += c;
          setText(acc);
        },
      });
    } catch {
      setText(t("common.error"));
    }
    setBusy(false);
  }

  const score = hits.length ? ecoScore(hits) : null;

  return (
    <div className="holo-panel fixed inset-x-3 bottom-[5.5rem] z-[1000] mx-auto max-w-md p-4">
      <div className="flex items-center justify-between">
        <span className="panel-title">
          <Sparkles size={15} className="text-sonar" />
          <span className="instrument-label">{t("chart.aiPanel")}</span>
        </span>
        <div className="flex items-center gap-3">
          {score !== null ? (
            <span
              className={`instrument text-sm ${
                score >= 80
                  ? "text-risk-green"
                  : score >= 50
                    ? "text-risk-yellow"
                    : "text-risk-red"
              }`}
            >
              ECO {score}/100
            </span>
          ) : null}
          <button onClick={onClose} aria-label={t("common.cancel")}>
            <X size={16} className="text-mist" />
          </button>
        </div>
      </div>

      {/* Conflicts list */}
      {hits.length > 0 ? (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {hits.slice(0, 3).map((h) => (
            <p
              key={h.area.id}
              className={`text-xs ${
                h.crosses && h.active
                  ? "text-risk-red"
                  : h.crosses
                    ? "text-risk-yellow"
                    : "text-mist"
              }`}
            >
              {h.crosses ? "⚠ " : "· "}
              {h.area.name} —{" "}
              {h.crosses
                ? t("chart.routeCrosses")
                : t("chart.routeNear", { meters: h.distanceM })}
              {h.active ? ` (${t("chart.activeNow")})` : ""}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          className="btn-ghost flex-1 !py-2.5 text-xs"
          onClick={() => run("briefing")}
          disabled={busy}
        >
          <Sparkles size={13} /> {t("chart.readChart")}
        </button>
        {routeActive ? (
          <button
            className="btn-primary flex-1 !py-2.5 text-xs"
            onClick={() => run("eco")}
            disabled={busy}
          >
            <Leaf size={13} /> {t("chart.ecoAnalysis")}
          </button>
        ) : null}
      </div>

      {text || busy ? (
        <p
          className={`mt-3 max-h-44 overflow-y-auto text-sm leading-relaxed text-foam/90 whitespace-pre-wrap ${busy ? "caret" : ""}`}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
