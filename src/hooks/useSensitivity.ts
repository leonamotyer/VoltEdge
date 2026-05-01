/**
 * Hook for fetching NPV sensitivity analysis data.
 *
 * Provides tornado chart data showing how ±20% perturbations in 6 key parameters
 * affect NPV.
 */
import { useState, useEffect } from "react";

interface SensitivityData {
  parameter: string;
  downside_npv: number;
  upside_npv: number;
  downside_delta: number;
  upside_delta: number;
  total_impact: number;
}

interface SensitivityResponse {
  baseline_npv: number;
  baseline_irr: number;
  sensitivities: SensitivityData[];
}

interface DispatchConfig {
  gpu_mw: number;
  gpu_type: string;
  unit_price_override?: number | null;
  rental_hr_override?: number | null;
  batt_mwh: number;
  batt_p_mw: number;
  eta_c?: number;
  eta_d?: number;
  grid_cap_mw: number;
  btf_cap_mw: number;
  btf_price: number;
  curt_price: number;
  discount_rate: number;
  project_life: number;
}

interface UseSensitivityResult {
  baselineNpv: number | null;
  baselineIrr: number | null;
  sensitivities: SensitivityData[];
  loading: boolean;
  error: string | null;
}

export function useSensitivity(config: DispatchConfig | null): UseSensitivityResult {
  const [data, setData] = useState<SensitivityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchSensitivity = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("http://localhost:8001/api/sensitivity/npv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const result: SensitivityResponse = await response.json();
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch sensitivity data";
        setError(errorMessage);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSensitivity();
  }, [JSON.stringify(config)]);

  return {
    baselineNpv: data?.baseline_npv ?? null,
    baselineIrr: data?.baseline_irr ?? null,
    sensitivities: data?.sensitivities ?? [],
    loading,
    error,
  };
}
