import { useEffect, useState } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/types/config";

interface BatterySweepResult {
  batt_mwh: number;
  "uptime_%": number;
  "coverage_%": number;
  "net_profit_$M": number;
  "capex_$M": number;
  payback_yrs: number;
  "roi_%": number;
  "avg_cost_$/mwh": number;
}

interface GpuSweepResult {
  n_racks: number;
  n_gpus: number;
  gpu_mw: number;
  "uptime_%": number;
  "profit_$M": number;
}

interface UseOptimizationSweepsResult {
  batterySweep: BatterySweepResult[];
  gpuSweep: GpuSweepResult[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch optimization sweep results for battery sizing and GPU rack count.
 *
 * Connects to:
 * - `/api/optimization/battery-sweep` - Tests 10 battery sizes (0-20 MWh)
 * - `/api/optimization/gpu-sweep` - Tests rack counts 1-40 (step 2)
 *
 * Returns sweep tables with metrics:
 * - Battery: uptime, coverage, ROI, payback, net profit, CAPEX
 * - GPU: rack count, power, uptime, profit
 *
 * Auto-refetches when configuration (GPU, battery, grid) changes.
 */
export function useOptimizationSweeps(): UseOptimizationSweepsResult {
  const { gpuConfig, batteryConfig, gridConfig } = useConfig();
  const [data, setData] = useState<UseOptimizationSweepsResult | null>(null);
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

        // Shared payload parameters
        const basePayload = {
          gpu_mw: gpuMetrics.totalComputePowerMw,
          grid_cap_mw: gridConfig.gridPowerLimit,
          btf_cap_mw: gridConfig.btfPowerLimit,
          btf_price: gridConfig.btfPrice,
          curt_price: gridConfig.curtailmentValue,
          gpu_type: gpuConfig.gpuModel,
          discount_rate: 0.08,
          project_life: 12,
        };

        // Fetch battery sweep
        const batterySweepResponse = await fetch("/api/optimization/battery-sweep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload),
        });

        if (!batterySweepResponse.ok) {
          throw new Error(`Battery sweep API error: ${batterySweepResponse.status}`);
        }

        const batterySweepData = await batterySweepResponse.json();

        // Fetch GPU sweep
        const gpuSweepPayload = {
          ...basePayload,
          batt_mwh: batteryConfig.includeBattery ? batteryConfig.batterySize : 0,
          batt_p_mw: batteryConfig.includeBattery 
            ? (batteryConfig.batteryPower || gpuMetrics.totalComputePowerMw) 
            : 0,
        };

        const gpuSweepResponse = await fetch("/api/optimization/gpu-sweep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gpuSweepPayload),
        });

        if (!gpuSweepResponse.ok) {
          throw new Error(`GPU sweep API error: ${gpuSweepResponse.status}`);
        }

        const gpuSweepData = await gpuSweepResponse.json();

        setData({
          batterySweep: batterySweepData.results || [],
          gpuSweep: gpuSweepData.results || [],
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
    batterySweep: [],
    gpuSweep: [],
    loading,
    error,
  };
}
