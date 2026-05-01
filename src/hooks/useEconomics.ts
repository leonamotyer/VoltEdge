import { useEffect, useState } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/types/config";

interface MarginalCostRecord {
  hour: number;
  "marginal_cost_$/mwh": number;
  source: string;
  "pool_price_$/mwh": number;
}

interface ArbitrageRecord extends MarginalCostRecord {
  "spread_$/mwh": number;
}

interface CostDistribution {
  [source: string]: {
    min: number;
    max: number;
    median: number;
    q1: number;
    q3: number;
    mean: number;
    count: number;
  };
}

interface UseEconomicsResult {
  marginalCosts: MarginalCostRecord[];
  arbitrageOpportunities: ArbitrageRecord[];
  costDistribution: CostDistribution;
  summary: {
    total_hours: number;
    "avg_marginal_cost_$/mwh": number;
    "avg_pool_price_$/mwh": number;
    "avg_spread_$/mwh": number;
  };
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch marginal cost analysis and arbitrage opportunities.
 * 
 * Connects to `/api/economics/marginal-costs` endpoint which provides:
 * - Hourly marginal cost time-series by energy source
 * - Identification of arbitrage hours where pool price exceeds marginal cost
 * - Statistical distribution of costs by source type
 * 
 * Returns transformed data ready for chart consumption:
 * - marginalCosts: Array of hourly cost records with source identification
 * - arbitrageOpportunities: Filtered array of profitable arbitrage hours
 * - costDistribution: Boxplot statistics by energy source
 * - summary: Overall metrics for the analysis period
 * 
 * Auto-refetches when configuration (GPU, battery, grid) changes.
 */
export function useEconomics(): UseEconomicsResult {
  const { gpuConfig, batteryConfig, gridConfig } = useConfig();
  const [data, setData] = useState<UseEconomicsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!gpuConfig || !gridConfig) {
        setLoading(false);
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const gpuMetrics = calculateGpuMetrics(gpuConfig);

        const requestBody = {
          gpu_mw: gpuMetrics.totalComputePowerMw,
          batt_mwh: batteryConfig.includeBattery ? batteryConfig.batterySize : 0,
          batt_p_mw: batteryConfig.includeBattery
            ? (batteryConfig.batteryPower ?? gpuMetrics.totalComputePowerMw)
            : 0,
          eta_c: batteryConfig.includeBattery ? batteryConfig.roundTripEfficiency / 100 : 0.95,
          eta_d: batteryConfig.includeBattery ? batteryConfig.roundTripEfficiency / 100 : 0.95,
          grid_cap_mw: gridConfig.gridPowerLimit,
          btf_cap_mw: gridConfig.btfPowerLimit,
          btf_price: gridConfig.btfPrice,
          curt_price: gridConfig.curtailmentValue,
          batt_cycle_life: 5000,  // Default battery cycle life
          arbitrage_threshold_usd_per_mwh: 5.0,  // Default arbitrage threshold
        };

        const response = await fetch("http://localhost:8001/api/economics/marginal-costs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Economics API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        setData({
          marginalCosts: result.marginal_costs || [],
          arbitrageOpportunities: result.arbitrage_hours || [],
          costDistribution: result.cost_distribution || {},
          summary: result.summary || {
            total_hours: 0,
            "avg_marginal_cost_$/mwh": 0,
            "avg_pool_price_$/mwh": 0,
            "avg_spread_$/mwh": 0,
          },
          loading: false,
          error: null,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify({ gpuConfig, batteryConfig, gridConfig })]);

  return data || {
    marginalCosts: [],
    arbitrageOpportunities: [],
    costDistribution: {},
    summary: {
      total_hours: 0,
      "avg_marginal_cost_$/mwh": 0,
      "avg_pool_price_$/mwh": 0,
      "avg_spread_$/mwh": 0,
    },
    loading,
    error,
  };
}
