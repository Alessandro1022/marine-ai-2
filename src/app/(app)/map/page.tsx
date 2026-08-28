"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useT } from "@/lib/i18n";

const MarineMap = dynamic(() => import("@/components/map/MarineMap"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function MapPage() {
  const t = useT();
  return (
    <div>
      <PageHeader title={t("chart.title")} subtitle={t("chart.subtitle")} />
      <MarineMap />
    </div>
  );
}
