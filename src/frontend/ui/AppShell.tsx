"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/frontend/ui/hooks/useMediaQuery";
import { TabNav } from "@/frontend/ui/components/TabNav";
import { ConfigSidebar } from "@/frontend/ui/components/ConfigSidebar";
import { ConfigProvider } from "@/frontend/context/ConfigContext";

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
    <ConfigProvider>
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
          <ConfigSidebar />
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
              <TabNav />
            </div>
          </header>
          <div id="main-content" className="content-main" tabIndex={-1}>
            {children}
          </div>
        </section>
      </main>
    </ConfigProvider>
  );
}
