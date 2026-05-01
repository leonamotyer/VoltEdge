import { useEffect, useState } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";

interface CurtailmentEvent {
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_mwh: number;
}

interface CurtailmentEventsResponse {
  events: CurtailmentEvent[];
  count: number;
}

interface UseCurtailmentEventsResult {
  events: CurtailmentEvent[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch curtailment event boundaries from the backend.
 * 
 * Connects to `/api/curtailment/events` endpoint and provides:
 * - List of detected curtailment events with start/end times and durations
 * - Loading and error states
 * 
 * Auto-refetches when configuration changes.
 */
export function useCurtailmentEvents(): UseCurtailmentEventsResult {
  const { gpuConfig } = useConfig();
  const [events, setEvents] = useState<CurtailmentEvent[]>([]);
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

        const response = await fetch("/api/curtailment/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result: CurtailmentEventsResponse = await response.json();
        setEvents(result.events || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(gpuConfig)]);

  return {
    events,
    loading,
    error,
  };
}
