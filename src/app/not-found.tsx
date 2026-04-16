import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h3 className="section-header">Page not found</h3>
      <section className="panel">
        <p>No dashboard route matches this URL.</p>
        <p style={{ marginTop: 12 }}>
          <Link href="/curtailment" className="nav-item" style={{ display: "inline-block" }}>
            Go to Curtailment Intelligence
          </Link>
        </p>
      </section>
    </>
  );
}
