import { useEffect, useState } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/types/config";

interface YearlyDetail {
  year: number;
  revenue_$: number;
  energy_cost_$: number;
  om_cost_$: number;
  cash_flow_$: number;
}

interface UseFinancialProjectionsResult {
  npv: number;
  irr: number;
  cashFlows: number[];
  terminalValue: number;
  yearlyDetails: YearlyDetail[];
  baselineFinancials: Record<string, any>;
  capex: Record<string, any>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch multi-year financial projections (NPV, IRR, 10-year cash flows).
 * 
 * Connects to `/api/financials/npv-irr` endpoint which provides:
 * - NPV and IRR calculations with 10-year projection
 * - Cash flow array including Year 0 CAPEX and Years 1-10
 * - GPU degradation modeling (2% annual efficiency loss)
 * - OPEX escalation (2.5% annual increase)
 * - Terminal value calculation
 * 
 * Returns transformed data ready for chart consumption:
 * - cashFlows: Array of 11 values (Year 0 through Year 10)
 * - yearlyDetails: Per-year breakdown of revenue, costs, cash flow
 * - npv, irr: Investor metrics
 * - capex: CAPEX breakdown for pie chart
 * 
 * Auto-refetches when configuration (GPU, battery, grid) changes.
 */
export function useFinancialProjections(): UseFinancialProjectionsResult {
  const { gpuConfig, batteryConfig, gridConfig } = useConfig();
  const [data, setData] = useState<UseFinancialProjectionsResult | null>(null);
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
          batt_p_mw: batteryConfig.includeBattery 
            ? (batteryConfig.batteryPower || gpuMetrics.totalComputePowerMw) 
            : 0,
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

        const response = await fetch("/api/financials/npv-irr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Financial projections API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        setData({
          npv: result.npv || 0,
          irr: result.irr || 0,
          cashFlows: result.cash_flows || [],
          terminalValue: result.terminal_value || 0,
          yearlyDetails: result.yearly_details || [],
          baselineFinancials: result.baseline_financials || {},
          capex: result.capex || {},
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
    npv: 0,
    irr: 0,
    cashFlows: [],
    terminalValue: 0,
    yearlyDetails: [],
    baselineFinancials: {},
    capex: {},
    loading,
    error,
  };
}
