"use client";

import { useEffect, useState, type ReactNode } from "react";
import { InvalidDataPanel } from "../ui/components/InvalidDataPanel";

interface DataBoundPageProps<T> {
  loader: () => Promise<unknown>;
  guard: (data: unknown) => data is T;
  routeLabel: string;
  children: (data: T) => ReactNode;
}

export function DataBoundPage<T>({ loader, guard, routeLabel, children }: DataBoundPageProps<T>) {
  const [data, setData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await loader();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [loader]);

  if (isLoading) {
    return (
      <div className="route-loading" role="status" aria-live="polite" aria-label={`Loading ${routeLabel}`}>
        <div className="route-loading-bar" />
        <div className="skeleton-grid skeleton-grid--kpi">
          <div className="skeleton kpi-skel kpi-skel--feature" />
          <div className="skeleton kpi-skel" />
          <div className="skeleton kpi-skel" />
        </div>
        <div className="skeleton-bento">
          <div className="skeleton panel-skel panel-skel--wide" />
          <div className="skeleton panel-skel" />
          <div className="skeleton panel-skel" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <h3 className="section-header">{routeLabel}</h3>
        <div className="energy-dashboard energy-dashboard--solo">
          <section className="panel panel--data">
            <h4>Error loading data</h4>
            <p className="error">{error.message}</p>
            <details>
              <summary>Error details</summary>
              <pre>{error.stack}</pre>
            </details>
          </section>
        </div>
      </>
    );
  }

  if (!guard(data)) {
    return (
      <>
        <h3 className="section-header">{routeLabel}</h3>
        <InvalidDataPanel routeLabel={routeLabel} data={data} />
      </>
    );
  }

  return <>{children(data)}</>;
}
