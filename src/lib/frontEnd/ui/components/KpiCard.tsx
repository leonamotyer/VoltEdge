"use client";

export function KpiCard({
  label,
  value,
  sub,
  tone,
  featured,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "blue" | "green" | "orange" | "red";
  featured?: boolean;
}) {
  const cls = ["kpi-card", tone, featured ? "kpi-card--feature" : ""].filter(Boolean).join(" ");
  return (
    <article className={cls}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <p className="kpi-sub">{sub}</p>
    </article>
  );
}
