import type { ReactNode } from "react";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  return (
    <>
      <h3 className="section-header">{title}</h3>
      {subtitle && (
        <p className="panel-subtle" style={{ marginTop: "-0.35rem", marginBottom: "1rem" }}>
          {subtitle}
        </p>
      )}
      <div className="energy-dashboard">{children}</div>
    </>
  );
}
