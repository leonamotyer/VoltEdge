"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { GpuConfig } from "@/frontend/gpu/types";
import type { BatteryConfig } from "@/frontend/battery/types";
import type { GridSupplyConfig } from "@/frontend/grid/types";
import { DEFAULT_BATTERY_CONFIG } from "@/frontend/battery/types";
import { DEFAULT_GRID_SUPPLY_CONFIG } from "@/frontend/grid/types";

interface ConfigContextType {
  gpuConfig: GpuConfig | null;
  batteryConfig: BatteryConfig;
  gridConfig: GridSupplyConfig;
  setGpuConfig: (config: GpuConfig | null) => void;
  setBatteryConfig: (config: BatteryConfig) => void;
  setGridConfig: (config: GridSupplyConfig) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [gpuConfig, setGpuConfig] = useState<GpuConfig | null>(null);
  const [batteryConfig, setBatteryConfig] = useState<BatteryConfig>(DEFAULT_BATTERY_CONFIG);
  const [gridConfig, setGridConfig] = useState<GridSupplyConfig>(DEFAULT_GRID_SUPPLY_CONFIG);

  return (
    <ConfigContext.Provider
      value={{
        gpuConfig,
        batteryConfig,
        gridConfig,
        setGpuConfig,
        setBatteryConfig,
        setGridConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
