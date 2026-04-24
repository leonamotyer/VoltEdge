import { KpiGrid } from "@/frontend/components/KpiGrid";
import { KpiCard } from "@/frontend/ui/components/KpiCard";

interface BatteryStorageKpisProps {
  capturedMWh: number;
  releasedMWh: number;
  estimatedGrossRevenueCad: number;
}

export function BatteryStorageKpis({
  capturedMWh,
  releasedMWh,
  estimatedGrossRevenueCad,
}: BatteryStorageKpisProps) {
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
        Battery Storage Simulation
      </h3>
      <KpiGrid>
        <KpiCard
          featured
          label="Captured"
          value={`${capturedMWh.toLocaleString()} MWh`}
          sub="From curtailed periods"
          tone="green"
        />
        <KpiCard
          label="Released"
          value={`${releasedMWh.toLocaleString()} MWh`}
          sub="After round-trip losses"
          tone="blue"
        />
        <KpiCard
          label="Gross revenue"
          value={`$${estimatedGrossRevenueCad.toLocaleString()} CAD`}
          sub="From battery arbitrage"
          tone="orange"
        />
      </KpiGrid>
    </section>
  );
}
