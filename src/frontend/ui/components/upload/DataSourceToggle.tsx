"use client";

import { useState, useEffect } from "react";

export function DataSourceToggle() {
  const [dataSource, setDataSource] = useState<"demo" | "uploaded">("demo");
  const [hasUploads, setHasUploads] = useState({
    curtailment: false,
    poolPrice: false,
  });
  const [loading, setLoading] = useState(true);

  // Fetch current data source status
  useEffect(() => {
    fetchDataSource();
  }, []);

  const fetchDataSource = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/upload/data-source");
      if (response.ok) {
        const data = await response.json();
        setDataSource(data.source);
        setHasUploads({
          curtailment: data.has_curtailment_upload,
          poolPrice: data.has_pool_price_upload,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data source:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newSource: "demo" | "uploaded") => {
    try {
      const response = await fetch("http://localhost:8001/api/upload/toggle-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: newSource }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.detail || "Failed to switch data source");
        return;
      }

      setDataSource(newSource);
    } catch (error) {
      console.error("Failed to toggle data source:", error);
      alert("Failed to switch data source");
    }
  };

  if (loading) {
    return <div className="data-source-toggle">Loading...</div>;
  }

  const canUseUploaded = hasUploads.curtailment || hasUploads.poolPrice;

  return (
    <div className="data-source-toggle">
      <label className="form-label">Data Source</label>
      
      <div className="toggle-buttons">
        <button
          type="button"
          className={`toggle-button ${dataSource === "demo" ? "active" : ""}`}
          onClick={() => handleToggle("demo")}
        >
          Demo Data
        </button>
        <button
          type="button"
          className={`toggle-button ${dataSource === "uploaded" ? "active" : ""}`}
          onClick={() => handleToggle("uploaded")}
          disabled={!canUseUploaded}
          title={!canUseUploaded ? "Upload files first" : ""}
        >
          Uploaded Data
        </button>
      </div>

      {dataSource === "uploaded" && (
        <div className="upload-status">
          <p className="upload-status-item">
            Curtailment: {hasUploads.curtailment ? "✓" : "✗"}
          </p>
          <p className="upload-status-item">
            Pool Price: {hasUploads.poolPrice ? "✓" : "✗"}
          </p>
        </div>
      )}

      <style jsx>{`
        .data-source-toggle {
          margin-bottom: 1rem;
        }

        .toggle-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .toggle-button {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .toggle-button.active {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .toggle-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-status {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .upload-status-item {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
