import { useEffect, useState } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";

interface HourlyProfile {
  hour: number;
  avg_curtailment_mw: number;
}

interface MonthlyProfile {
  month: string;
  total_curtailed_mwh: number;
  curtailment_rate_percent: number;
}

interface HourlyProfileResponse {
  hourly_profile: HourlyProfile[];
  hours: number;
}

interface MonthlyProfileResponse {
  monthly_profile: MonthlyProfile[];
  months: number;
}

interface UseCurtailmentProfilesResult {
  hourlyProfile: HourlyProfile[];
  monthlyProfile: MonthlyProfile[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch hourly and monthly curtailment aggregations from the backend.
 * 
 * Connects to `/api/curtailment/hourly-avg` and `/api/curtailment/monthly-profile` endpoints.
 * 
 * Provides:
 * - Hourly profile (24 values, one per hour of day)
 * - Monthly profile (total MWh and curtailment rate % per month)
 * - Loading and error states
 * 
 * Auto-refetches when configuration changes.
 */
export function useCurtailmentProfiles(): UseCurtailmentProfilesResult {
  const { gpuConfig } = useConfig();
  const [hourlyProfile, setHourlyProfile] = useState<HourlyProfile[]>([]);
  const [monthlyProfile, setMonthlyProfile] = useState<MonthlyProfile[]>([]);
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

        // Fetch both profiles in parallel
        const [hourlyResponse, monthlyResponse] = await Promise.all([
          fetch("/api/curtailment/hourly-avg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
          fetch("/api/curtailment/monthly-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        ]);

        if (!hourlyResponse.ok) {
          throw new Error(`Hourly API error: ${hourlyResponse.status} ${hourlyResponse.statusText}`);
        }
        if (!monthlyResponse.ok) {
          throw new Error(`Monthly API error: ${monthlyResponse.status} ${monthlyResponse.statusText}`);
        }

        const hourlyResult: HourlyProfileResponse = await hourlyResponse.json();
        const monthlyResult: MonthlyProfileResponse = await monthlyResponse.json();

        setHourlyProfile(hourlyResult.hourly_profile || []);
        setMonthlyProfile(monthlyResult.monthly_profile || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setHourlyProfile([]);
        setMonthlyProfile([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(gpuConfig)]);

  return {
    hourlyProfile,
    monthlyProfile,
    loading,
    error,
  };
}
