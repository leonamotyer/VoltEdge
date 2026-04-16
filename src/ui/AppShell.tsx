"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { sidebarNavItems } from "@/lib/frontEnd/components/sidebarNav";
import { useMediaQuery } from "@/ui/hooks/useMediaQuery";

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
          <h1>VoltEdge MDC</h1>
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
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="content">
        <header className="ve-header">
          <h2>VoltEdge MDC — Renewable Curtailment Intelligence</h2>
          <p>
            Curtailment analysis, load and storage sizing, and network feasibility in one decision
            view.
          </p>
        </header>
        {children}
      </section>
    </main>
  );
}
