"use client";

export interface SweepTableColumn {
  key: string;
  label: string;
  format?: (value: number) => string;
  colorize?: boolean; // Apply red-yellow-green gradient based on value
}

export interface SweepTableRow {
  [key: string]: number | string;
}

interface SweepTableProps {
  columns: SweepTableColumn[];
  rows: SweepTableRow[];
  title?: string;
}

export function SweepTable({ columns, rows, title }: SweepTableProps) {
  // Calculate min/max for colorized columns
  const getColorizeRange = (columnKey: string) => {
    const values = rows.map(row => typeof row[columnKey] === 'number' ? row[columnKey] as number : 0);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  // Get background color based on value position in range (red-yellow-green gradient)
  const getColorForValue = (value: number, min: number, max: number): string => {
    if (max === min) return 'rgba(255, 255, 255, 0)';
    
    const normalized = (value - min) / (max - min); // 0 to 1
    
    // Red (bad) -> Yellow (neutral) -> Green (good)
    let r, g, b;
    if (normalized < 0.5) {
      // Red to Yellow
      const t = normalized * 2;
      r = 255;
      g = Math.round(255 * t);
      b = 0;
    } else {
      // Yellow to Green
      const t = (normalized - 0.5) * 2;
      r = Math.round(255 * (1 - t));
      g = 255;
      b = 0;
    }
    
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };

  return (
    <div className="sweep-table-container">
      {title && <h3 className="sweep-table-title">{title}</h3>}
      <div className="sweep-table-wrapper">
        <table className="sweep-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => {
                  const value = row[col.key];
                  const formattedValue = 
                    typeof value === 'number' && col.format 
                      ? col.format(value)
                      : String(value);
                  
                  const backgroundColor = 
                    col.colorize && typeof value === 'number'
                      ? (() => {
                          const range = getColorizeRange(col.key);
                          return getColorForValue(value, range.min, range.max);
                        })()
                      : undefined;

                  return (
                    <td 
                      key={col.key} 
                      className="value-cell"
                      style={{ backgroundColor }}
                    >
                      {formattedValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .sweep-table-container {
          background: white;
          border-radius: 14px;
          padding: clamp(0.9rem, 2.5vw, 1.1rem);
          border: 1px solid rgba(26, 58, 82, 0.1);
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04), 0 18px 40px -22px rgba(26, 58, 82, 0.18);
          margin-top: clamp(1.2rem, 3.5vw, 1.6rem);
        }

        .sweep-table-title {
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          font-weight: 600;
          color: #1a3050;
          margin-bottom: clamp(0.6rem, 1.8vw, 0.75rem);
        }

        .sweep-table-wrapper {
          /* Allow horizontal scroll only on very small screens if needed */
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          /* No vertical scrolling - table expands to show all content */
          overflow-y: visible;
        }

        .sweep-table {
          width: 100%;
          border-collapse: collapse;
          font-size: clamp(0.7rem, 1.8vw, 0.76rem);
        }

        .sweep-table thead {
          background: linear-gradient(135deg, #1a3050 0%, #2d5077 100%);
          color: white;
        }

        .sweep-table th {
          padding: clamp(0.55rem, 1.8vw, 0.7rem) clamp(0.5rem, 1.8vw, 0.65rem);
          text-align: right;
          font-weight: 600;
          font-size: clamp(0.65rem, 1.6vw, 0.7rem);
          letter-spacing: 0.02em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .sweep-table th:first-child {
          text-align: left;
          border-top-left-radius: 10px;
        }

        .sweep-table th:last-child {
          border-top-right-radius: 10px;
        }

        .sweep-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: all 0.15s ease;
        }

        .sweep-table tbody tr:hover {
          background-color: #f1f5f9;
          transform: scale(1.002);
        }

        .sweep-table tbody tr:last-child {
          border-bottom: none;
        }

        .sweep-table td {
          padding: clamp(0.5rem, 1.8vw, 0.65rem) clamp(0.5rem, 1.8vw, 0.65rem);
          text-align: right;
          font-weight: 500;
          color: #1a3050;
          font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
          white-space: nowrap;
          font-size: clamp(0.68rem, 1.75vw, 0.73rem);
        }

        .sweep-table td:first-child {
          text-align: left;
          font-weight: 600;
        }

        .value-cell {
          transition: background-color 0.15s ease;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .sweep-table-container {
            border-radius: 12px;
            padding: 0.75rem;
            margin-top: 1rem;
          }

          .sweep-table-wrapper {
            margin: 0;
          }

          .sweep-table {
            font-size: 0.68rem;
          }

          .sweep-table th {
            padding: 0.5rem 0.4rem;
            font-size: 0.62rem;
            letter-spacing: 0.01em;
          }

          .sweep-table td {
            padding: 0.5rem 0.4rem;
            font-size: 0.66rem;
          }

          /* Reduce hover effect on mobile */
          .sweep-table tbody tr:hover {
            transform: scale(1);
          }
        }

        /* Extra small devices - even tighter spacing */
        @media (max-width: 400px) {
          .sweep-table-container {
            padding: 0.6rem;
          }

          .sweep-table th,
          .sweep-table td {
            padding: 0.4rem 0.3rem;
            font-size: 0.6rem;
          }

          .sweep-table th {
            font-size: 0.58rem;
          }
        }

        /* Very wide tables might still need horizontal scroll on small screens */
        @media (max-width: 640px) {
          .sweep-table-wrapper {
            /* Enable smooth horizontal scrolling if table is too wide */
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
          }

          .sweep-table-wrapper::-webkit-scrollbar {
            height: 4px;
          }

          .sweep-table-wrapper::-webkit-scrollbar-track {
            background: #f1f5f9;
          }

          .sweep-table-wrapper::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 2px;
          }
        }
      `}</style>
    </div>
  );
}
