import { NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { sidebarNavItems } from "../lib/frontEnd/components/sidebarNav";

export function AppLayout() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h1>VoltEdge MDC</h1>
        <p className="sidebar-subtitle">Investor & Partner Edition</p>
        <nav>
          {sidebarNavItems.map((item) => (
            <NavLink
              key={item.id}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
              to={item.href}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="ve-header">
          <h2>VoltEdge MDC - Renewable Curtailment Intelligence</h2>
          <p>
            Curtailment analysis, load and storage sizing, and network feasibility in one
            decision view.
          </p>
        </header>
        <Outlet />
      </section>
    </main>
  );
}
