import { useEffect, useState } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/types/config";

interface DispatchSimulationData {
  soc: number[];
  served: number[];
  unmet: number[];
}

interface DispatchResponse {
  dispatch: Record<string, any>;
  capex: Record<string, any>;
  financials: Record<string, any>;
  timeseries: DispatchSimulationData;
  energy_mix_summary?: {
    curtailed_percent: number;
    battery_percent: number;
    btf_percent: number;
    grid_percent: number;
    unmet_percent: number;
  };
  pnl_waterfall?: {
    revenue: number;
    energy_cost: number;
    capex: number;
    opex: number;
    net_profit: number;
  };
}

interface UseDispatchSimulationResult {
  socTimeSeries: Array<{
    timestamp: string;
    socPercent: number;
    capacityUsedMWh: number;
  }>;
  energyMix: {
    curtailedWindMWh: number;
    batteryDischargeMWh: number;
    gridImportMWh: number;
    btfMWh: number;
    totalMWh: number;
  };
  data: DispatchResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and transform dispatch simulation data from the backend.
 *
 * Connects to `/api/dispatch/simulate` endpoint and provides:
 * - Battery State of Charge time-series
 * - Energy mix breakdown
 * - Loading and error states
 *
 * Auto-refetches when configuration (GPU, battery, grid) changes.
 */
export function useDispatchSimulation(): UseDispatchSimulationResult {
  const { gpuConfig, batteryConfig, gridConfig } = useConfig();
  const [data, setData] = useState<UseDispatchSimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!gpuConfig) {
        setLoading(false);
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const gpuMetrics = calculateGpuMetrics(gpuConfig);

        const payload = {
          gpu_mw: gpuMetrics.totalComputePowerMw,
          batt_mwh: batteryConfig.includeBattery ? batteryConfig.batterySize : 0,
          batt_p_mw: batteryConfig.includeBattery ? (batteryConfig.batteryPower || gpuMetrics.totalComputePowerMw) : 0,
          grid_cap_mw: gridConfig.gridPowerLimit,
          btf_cap_mw: gridConfig.btfPowerLimit,
          btf_price: gridConfig.btfPrice,
          curt_price: gridConfig.curtailmentValue,
          eta_c: batteryConfig.roundTripEfficiency / 100,
          eta_d: batteryConfig.roundTripEfficiency / 100,
          gpu_type: gpuConfig.gpuModel,
          discount_rate: 0.08,
          project_life: 12,
        };

        const response = await fetch("/api/dispatch/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result: DispatchResponse = await response.json();

        // Transform SoC array to time-series with timestamps
        const socTimeSeries = transformSocToTimeSeries(
          result.timeseries.soc,
          batteryConfig.batterySize
        );

        // Build energy mix from dispatch results
        const energyMix = {
          curtailedWindMWh: result.dispatch.annual_direct_curt_used_mwh || 0,
          batteryDischargeMWh: result.dispatch.annual_batt_used_mwh || 0,
          gridImportMWh: result.dispatch.annual_grid_used_mwh || 0,
          btfMWh: result.dispatch.annual_btf_used_mwh || 0,
          totalMWh: result.dispatch.annual_served_mwh || 0,
        };

        setData({
          socTimeSeries,
          energyMix,
          data: result,
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
    socTimeSeries: [],
    energyMix: {
      curtailedWindMWh: 0,
      batteryDischargeMWh: 0,
      gridImportMWh: 0,
      btfMWh: 0,
      totalMWh: 0,
    },
    data: null,
    loading,
    error,
  };
}

/**
 * Transform raw SoC array (MWh) from backend to timestamped percentage series.
 * Backend returns 52,704 points (10-min intervals for leap year).
 * We sample to create a 48-hour view at hourly resolution.
 */
function transformSocToTimeSeries(
  socMwh: number[],
  batteryMwh: number
): Array<{ timestamp: string; socPercent: number; capacityUsedMWh: number }> {
  if (!socMwh || socMwh.length === 0 || !batteryMwh) {
    return [];
  }

  // Sample every 6th point (10min × 6 = 60min) for first 48 hours
  const hoursToShow = 48;
  const pointsPerHour = 6; // 10-min intervals
  const result: Array<{ timestamp: string; socPercent: number; capacityUsedMWh: number }> = [];
  const baseDate = new Date("2026-01-01T00:00:00Z");

  for (let hour = 0; hour < hoursToShow && hour * pointsPerHour < socMwh.length; hour++) {
    const index = hour * pointsPerHour;
    const capacityMwh = socMwh[index];
    const socPercent = batteryMwh > 0 ? (capacityMwh / batteryMwh) * 100 : 0;

    result.push({
      timestamp: new Date(baseDate.getTime() + hour * 60 * 60 * 1000).toISOString(),
      socPercent: Math.round(socPercent * 10) / 10,
      capacityUsedMWh: Math.round(capacityMwh * 10) / 10,
    });
  }

  return result;
}
