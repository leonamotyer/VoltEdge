"use client";

interface KpiTableRow {
  metric: string;
  value: string;
}

interface KpiTableProps {
  rows: KpiTableRow[];
  title?: string;
}

export function KpiTable({ rows, title }: KpiTableProps) {
  return (
    <div className="kpi-table-container">
      {title && <h3 className="kpi-table-title">{title}</h3>}
      <div className="kpi-table-wrapper">
        <table className="kpi-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="metric-cell">{row.metric}</td>
                <td className="value-cell">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .kpi-table-container {
          background: white;
          border-radius: 14px;
          padding: clamp(0.9rem, 2.5vw, 1.1rem);
          border: 1px solid rgba(26, 58, 82, 0.1);
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04), 0 18px 40px -22px rgba(26, 58, 82, 0.18);
        }

        .kpi-table-title {
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          font-weight: 600;
          color: #1a3050;
          margin-bottom: clamp(0.6rem, 1.8vw, 0.75rem);
        }

        .kpi-table-wrapper {
          /* No scrolling - table expands to show all content */
          overflow: visible;
        }

        .kpi-table {
          width: 100%;
          border-collapse: collapse;
          font-size: clamp(0.75rem, 1.9vw, 0.8125rem);
        }

        .kpi-table thead {
          background: linear-gradient(135deg, #1a3050 0%, #2d5077 100%);
          color: white;
        }

        .kpi-table th {
          padding: clamp(0.55rem, 1.8vw, 0.7rem) clamp(0.7rem, 2.2vw, 0.85rem);
          text-align: left;
          font-weight: 600;
          font-size: clamp(0.7rem, 1.7vw, 0.75rem);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .kpi-table th:first-child {
          border-top-left-radius: 10px;
        }

        .kpi-table th:last-child {
          border-top-right-radius: 10px;
        }

        .kpi-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background-color 0.15s ease;
        }

        .kpi-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .kpi-table tbody tr:last-child {
          border-bottom: none;
        }

        .kpi-table td {
          padding: clamp(0.5rem, 1.8vw, 0.65rem) clamp(0.7rem, 2.2vw, 0.85rem);
        }

        .metric-cell {
          font-weight: 500;
          color: #475569;
          font-size: clamp(0.72rem, 1.85vw, 0.79rem);
          word-break: break-word;
        }

        .value-cell {
          font-weight: 600;
          color: #1a3050;
          font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
          font-size: clamp(0.72rem, 1.85vw, 0.79rem);
          word-break: break-word;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .kpi-table-container {
            border-radius: 12px;
            padding: 0.8rem;
          }

          .kpi-table-wrapper {
            margin: 0;
          }

          .kpi-table {
            font-size: 0.75rem;
          }

          .kpi-table th,
          .kpi-table td {
            padding: 0.5rem 0.6rem;
            font-size: 0.72rem;
          }

          .kpi-table th {
            font-size: 0.68rem;
          }

          .metric-cell,
          .value-cell {
            font-size: 0.72rem;
          }
        }

        /* Extra small devices */
        @media (max-width: 400px) {
          .kpi-table th,
          .kpi-table td {
            padding: 0.45rem 0.5rem;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
