"use client";

export function InvalidDataPanel({ routeLabel, data }: { routeLabel: string; data: unknown }) {
  return (
    <div className="energy-dashboard energy-dashboard--solo">
      <section className="panel panel--data">
        <h4>{routeLabel} data shape mismatch</h4>
        <p className="error">The loader returned an unexpected payload format.</p>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </section>
    </div>
  );
}
