"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Bot, BookOpen, User } from "lucide-react";
import { useT } from "@/lib/i18n";

const TABS = [
  { href: "/dashboard", icon: Home, key: "nav.home" },
  { href: "/map", icon: Map, key: "nav.map" },
  { href: "/ai", icon: Bot, key: "nav.ai" },
  { href: "/logbook", icon: BookOpen, key: "nav.logbook" },
  { href: "/profile", icon: User, key: "nav.profile" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-deep/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md justify-around">
        {TABS.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[0.6rem] uppercase tracking-wider transition-colors ${
                active ? "text-sonar" : "text-mist"
              }`}
            >
              <span className={active ? "drop-shadow-[0_0_8px_rgba(45,224,190,0.8)]" : ""}>
                <Icon size={21} strokeWidth={active ? 2 : 1.6} />
              </span>
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
