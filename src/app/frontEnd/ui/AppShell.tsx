"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavIconKey } from "@/app/frontEnd/ui/components/sidebarNav";
import { sidebarNavItems } from "@/app/frontEnd/ui/components/sidebarNav";
import { NavIconCurtailment, NavIconNetwork, NavIconRoi, NavIconStorage } from "@/app/frontEnd/ui/components/NavIcon";
import { useMediaQuery } from "@/app/frontEnd/ui/hooks/useMediaQuery";

function NavIcon({ name, className }: { name: NavIconKey; className?: string }) {
  switch (name) {
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const isDesktopNav = useMediaQuery("(min-width: 900px)");

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isDesktopNav) {
      setNavOpen(false);
    }
  }, [isDesktopNav]);

  useEffect(() => {
    if (!navOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNavOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <main className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {navOpen ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside id="app-sidebar" className={`sidebar${navOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-mark" aria-hidden="true" />
          <h1>
            <span className="sidebar-title-strong">VoltEdge</span>
            <span className="sidebar-title-rest"> MDC</span>
          </h1>
          <p className="sidebar-subtitle">Investor & Partner Edition</p>
        </div>
        <nav aria-label="Primary">
          {sidebarNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={active ? "nav-item active" : "nav-item"}
                prefetch
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-item-inner">
                  <NavIcon name={item.icon} className="nav-item-icon" />
                  <span className="nav-item-label">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="content">
        <header className="ve-header">
          <div className="ve-header-glow" aria-hidden="true" />
          <div className="ve-header-toolbar">
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={navOpen}
              aria-controls="app-sidebar"
              aria-label={navOpen ? "Close menu" : "Open menu"}
              onClick={() => setNavOpen((o) => !o)}
            >
              <span className="nav-toggle-bar" aria-hidden />
              <span className="nav-toggle-bar" aria-hidden />
              <span className="nav-toggle-bar" aria-hidden />
            </button>
            <div className="ve-header-inner">
              <div className="ve-header-row">
                <div className="ve-header-lead">
                  <p className="ve-header-eyebrow">Clean energy decision stack</p>
                  <h2>Renewable curtailment intelligence</h2>
                </div>
                <span className="ve-badge" title="All figures use demo repositories until live feeds are wired">
                  Demo data
                </span>
              </div>
              <p className="ve-header-dek">
                Curtailment analysis, load and storage sizing, and network feasibility in one live-feel
                investor view.
              </p>
            </div>
          </div>
        </header>
        <div id="main-content" className="content-main" tabIndex={-1}>
          {children}
        </div>
        <footer className="content-foot" role="contentinfo">
          <p>
            <strong>Prototype.</strong> Numbers illustrate layout and flow; replace repositories with
            production sources before investment decisions.
          </p>
        </footer>
      </section>
    </main>
  );
}
