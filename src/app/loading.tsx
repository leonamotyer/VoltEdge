/** Route-level loading UI — visibility of system status (Nielsen #1). */
export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite" aria-label="Loading dashboard">
      <div className="route-loading-bar" />
      <div className="skeleton-grid">
        <div className="skeleton kpi-skel" />
        <div className="skeleton kpi-skel" />
        <div className="skeleton kpi-skel" />
      </div>
      <div className="skeleton panel-skel" />
      <div className="skeleton panel-skel" />
    </div>
  );
}
