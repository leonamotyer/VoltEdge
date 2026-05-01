"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavIconKey } from "./sidebarNav";
import { sidebarNavItems } from "./sidebarNav";
import { NavIconCurtailment, NavIconNetwork, NavIconRoi, NavIconStorage, NavIconExecutiveSummary } from "./NavIcon";

function NavIcon({ name, className }: { name: NavIconKey; className?: string }) {
  switch (name) {
    case "executive-summary":
      return <NavIconExecutiveSummary className={className} />;
    case "curtailment":
      return <NavIconCurtailment className={className} />;
    case "load-storage":
      return <NavIconStorage className={className} />;
    case "network-fiber":
      return <NavIconNetwork className={className} />;
    case "roi":
      return <NavIconRoi className={className} />;
    default:
      return null;
  }
}

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="tab-nav" aria-label="Main navigation">
      <div className="tab-nav-inner">
        {sidebarNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={active ? "tab-nav-item tab-nav-item--active" : "tab-nav-item"}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon name={item.icon} className="tab-nav-icon" />
              <span className="tab-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
