"use client";

import { Circle, Tooltip } from "react-leaflet";
import {
  AREA_STYLE,
  isAreaActive,
  type ProtectedArea,
} from "@/lib/services/ecoService";
import { useT } from "@/lib/i18n";

export function ProtectedAreasLayer({ areas }: { areas: ProtectedArea[] }) {
  const t = useT();

  return (
    <>
      {areas.map((a) => {
        const style = AREA_STYLE[a.kind];
        const active = isAreaActive(a);
        return (
          <Circle
            key={a.id}
            center={[a.latitude, a.longitude]}
            radius={a.radius_m}
            pathOptions={{
              color: style.color,
              weight: active ? 2 : 1,
              opacity: active ? 0.9 : 0.45,
              fillColor: style.color,
              fillOpacity: active ? 0.14 : 0.06,
              dashArray: active ? undefined : "6 6",
            }}
          >
            <Tooltip direction="top" opacity={1}>
              <div style={{ fontSize: 12 }}>
                <strong>{a.name}</strong>
                <br />
                {t(style.labelKey)}
                {a.season_start
                  ? ` · ${a.season_start} → ${a.season_end}`
                  : ""}
                {a.restriction ? (
                  <>
                    <br />
                    {a.restriction}
                  </>
                ) : null}
                {!active ? (
                  <>
                    <br />
                    <em>{t("chart.offSeason")}</em>
                  </>
                ) : null}
              </div>
            </Tooltip>
          </Circle>
        );
      })}
    </>
  );
}
