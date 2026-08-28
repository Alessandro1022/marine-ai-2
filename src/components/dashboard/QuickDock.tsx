"use client";

import Link from "next/link";
import { Route, Calculator, ShieldAlert, Cable, Anchor, Wrench } from "lucide-react";
import { useT } from "@/lib/i18n";

const ACTIONS = [
  { href: "/route-planner", icon: Route, key: "route.title" },
  { href: "/fuel", icon: Calculator, key: "fuel.title" },
  { href: "/marinas", icon: Anchor, key: "marinas.title" },
  { href: "/maintenance", icon: Wrench, key: "maintenance.title" },
  { href: "/safety", icon: ShieldAlert, key: "safety.title" },
  { href: "/integrations", icon: Cable, key: "integrations.title" },
] as const;

export function QuickDock() {
  const t = useT();
  return (
    <section>
      <span className="instrument-label">{t("home.quickActions")}</span>
      <div className="-mx-1 mt-2 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {ACTIONS.map(({ href, icon: Icon, key }, i) => (
          <Link
            key={href}
            href={href}
            className="glass-card flex min-w-[4.6rem] flex-col items-center gap-1.5 p-3"
            style={{ animation: `float-y ${3 + (i % 3) * 0.6}s ease-in-out infinite` }}
          >
            <Icon size={19} className="text-sonar" strokeWidth={1.7} />
            <span className="text-center text-[0.6rem] leading-tight text-mist">
              {t(key)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
