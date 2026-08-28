"use client";

import { useState } from "react";
import {
  Layers, Route, Ruler, Anchor, Navigation, Eraser, MapIcon,
} from "lucide-react";
import { useMapStore, type MapMode } from "@/stores/mapStore";
import { useT } from "@/lib/i18n";

export function MapControls({
  onLocate,
  onSetAnchorHere,
}: {
  onLocate: () => void;
  onSetAnchorHere: () => void;
}) {
  const t = useT();
  const store = useMapStore();
  const [showLayers, setShowLayers] = useState(false);

  function setMode(m: MapMode) {
    store.setMode(store.mode === m ? "explore" : m);
    if (m === "route") store.clearRoute();
    if (m === "measure") store.clearMeasure();
  }

  const MODES: { id: MapMode; icon: typeof Route; key: string }[] = [
    { id: "route", icon: Route, key: "chart.modeRoute" },
    { id: "measure", icon: Ruler, key: "chart.modeMeasure" },
  ];

  return (
    <>
      {/* Right-side tool column */}
      <div className="absolute right-3 top-3 z-[999] flex flex-col gap-2">
        <ToolBtn
          active={showLayers}
          onClick={() => setShowLayers(!showLayers)}
          label={t("chart.layers")}
        >
          <Layers size={17} />
        </ToolBtn>
        {MODES.map(({ id, icon: Icon, key }) => (
          <ToolBtn
            key={id}
            active={store.mode === id}
            onClick={() => setMode(id)}
            label={t(key)}
          >
            <Icon size={17} />
          </ToolBtn>
        ))}
        <ToolBtn
          active={!!store.anchor}
          onClick={() => {
            if (store.anchor) store.setAnchor(null);
            else onSetAnchorHere();
          }}
          label={t("chart.anchorWatch")}
        >
          <Anchor size={17} />
        </ToolBtn>
        <ToolBtn active={false} onClick={onLocate} label={t("map.myLocation")}>
          <Navigation size={17} />
        </ToolBtn>
        {(store.routeStart || store.measurePoints.length > 0) ? (
          <ToolBtn
            active={false}
            onClick={() => {
              store.clearRoute();
              store.clearMeasure();
            }}
            label={t("common.cancel")}
          >
            <Eraser size={17} />
          </ToolBtn>
        ) : null}
      </div>

      {/* Layer panel */}
      {showLayers ? (
        <div className="glass-card absolute right-14 top-3 z-[999] flex w-44 flex-col gap-2 p-3">
          <LayerToggle
            label={t("chart.layerSeamarks")}
            checked={store.showSeamarks}
            onChange={() => store.toggle("showSeamarks")}
          />
          <LayerToggle
            label={t("chart.layerMarinas")}
            checked={store.showMarinas}
            onChange={() => store.toggle("showMarinas")}
          />
          <LayerToggle
            label={t("chart.layerProtected")}
            checked={store.showProtected}
            onChange={() => store.toggle("showProtected")}
          />
          <LayerToggle
            label={t("chart.layerDark")}
            checked={store.darkBase}
            onChange={() => store.toggle("darkBase")}
          />
        </div>
      ) : null}

      {/* Mode hint */}
      {store.mode !== "explore" ? (
        <div className="absolute left-1/2 top-3 z-[999] -translate-x-1/2 rounded-full border border-sonar/40 bg-deep/85 px-4 py-1.5 backdrop-blur">
          <span className="instrument-label text-sonar">
            <MapIcon size={11} className="mr-1.5 inline" />
            {store.mode === "route" ? t("chart.tapRoute") : t("chart.tapMeasure")}
          </span>
        </div>
      ) : null}
    </>
  );
}

function ToolBtn({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur transition-colors ${
        active
          ? "border-sonar/60 bg-sonar/20 text-sonar shadow-sonar"
          : "border-white/12 bg-deep/80 text-foam"
      }`}
    >
      {children}
    </button>
  );
}

function LayerToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button onClick={onChange} className="flex items-center justify-between text-left">
      <span className="text-xs">{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-sonar" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-foam transition-transform ${checked ? "translate-x-4.5 left-0.5 translate-x-4" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
