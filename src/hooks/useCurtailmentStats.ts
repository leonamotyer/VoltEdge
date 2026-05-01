import { useEffect, useState } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";

interface CurtailmentStats {
  total_events: number;
  median_duration: number;
  longest_event_hours: number;
  top_10_percent_share: number;
}

interface UseCurtailmentStatsResult {
  stats: CurtailmentStats | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch curtailment event statistics from the backend.
 * 
 * Connects to `/api/curtailment/stats` endpoint and provides:
 * - Total events count
 * - Median event duration
 * - Longest event duration
 * - Top 10% share of total curtailment
 * 
 * Auto-refetches when configuration changes.
 */
export function useCurtailmentStats(): UseCurtailmentStatsResult {
  const { gpuConfig } = useConfig();
  const [stats, setStats] = useState<CurtailmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build request payload (currently uses demo data, but structure prepared for future filtering)
        const payload = {
          turbine_count: gpuConfig?.numberOfGpus || 10,
          turbine_model: "V150-4.2",
          site_name: "Demo Site",
          start_date: "2026-01-01",
          end_date: "2026-03-31",
        };

        const response = await fetch("/api/curtailment/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result: CurtailmentStats = await response.json();
        setStats(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(gpuConfig)]);

  return {
    stats,
    loading,
    error,
  };
}
