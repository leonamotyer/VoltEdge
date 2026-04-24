import { GpuCharts } from "@/frontend/gpu/GpuCharts";
import type { GpuConfig } from "@/frontend/gpu/types";

interface GpuRevenueSectionProps {
  gpuConfig: GpuConfig | null;
  energyMix: {
    curtailedWindMWh: number;
    batteryDischargeMWh: number;
    gridImportMWh: number;
    btfMWh: number;
    totalMWh: number;
  };
}

export function GpuRevenueSection({ gpuConfig, energyMix }: GpuRevenueSectionProps) {
  // Only render if GPU config is provided
  if (!gpuConfig) {
    return null;
  }

  return (
    <section style={{ marginBottom: "clamp(1.5rem, 4vw, 2rem)" }}>
      <h3
        style={{
          fontSize: "clamp(1rem, 2.8vw, 1.125rem)",
          fontWeight: 600,
          color: "#1a3050",
          marginBottom: "clamp(0.75rem, 2vw, 1rem)",
        }}
      >
        GPU Revenue Simulation
      </h3>
      <GpuCharts config={gpuConfig} energyMix={energyMix} />
    </section>
  );
}
