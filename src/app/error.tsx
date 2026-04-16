"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <h3 className="section-header">Something went wrong</h3>
      <section className="panel">
        <h4>Application error</h4>
        <p className="error">{error.message}</p>
        <p style={{ marginTop: 12 }}>
          <button type="button" className="nav-item" style={{ display: "inline-block" }} onClick={() => reset()}>
            Try again
          </button>
        </p>
      </section>
    </>
  );
}
