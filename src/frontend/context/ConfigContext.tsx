"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type {
  GpuConfig,
  BatteryConfig,
  GridSupplyConfig,
  BtfConfig,
  FinancialParams,
} from "@/frontend/types/config";
import {
  DEFAULT_BATTERY_CONFIG,
  DEFAULT_GRID_SUPPLY_CONFIG,
  DEFAULT_BTF_CONFIG,
  DEFAULT_FINANCIAL_PARAMS,
} from "@/frontend/types/config";

const GPU_CONFIG_STORAGE_KEY = "voltedge-gpu-config";
const BTF_CONFIG_STORAGE_KEY = "voltedge-btf-config";
const FINANCIAL_PARAMS_STORAGE_KEY = "voltedge-financial-params";

interface ConfigContextType {
  gpuConfig: GpuConfig | null;
  batteryConfig: BatteryConfig;
  gridConfig: GridSupplyConfig;
  btfConfig: BtfConfig;
  financialParams: FinancialParams;
  setGpuConfig: (config: GpuConfig | null) => void;
  setBatteryConfig: (config: BatteryConfig) => void;
  setGridConfig: (config: GridSupplyConfig) => void;
  setBtfConfig: (config: BtfConfig) => void;
  setFinancialParams: (params: FinancialParams) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [gpuConfig, setGpuConfig] = useState<GpuConfig | null>(null);
  const [batteryConfig, setBatteryConfig] = useState<BatteryConfig>(DEFAULT_BATTERY_CONFIG);
  const [gridConfig, setGridConfig] = useState<GridSupplyConfig>(DEFAULT_GRID_SUPPLY_CONFIG);
  const [btfConfig, setBtfConfig] = useState<BtfConfig>(DEFAULT_BTF_CONFIG);
  const [financialParams, setFinancialParams] = useState<FinancialParams>(DEFAULT_FINANCIAL_PARAMS);

  // Load GPU config from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(GPU_CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setGpuConfig(parsed);
      }
    } catch (error) {
      console.error("Failed to load GPU config from localStorage:", error);
    }
  }, []);

  // Load BTF config from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(BTF_CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setBtfConfig(parsed);
      }
    } catch (error) {
      console.error("Failed to load BTF config from localStorage:", error);
    }
  }, []);

  // Load Financial params from localStorage on mount
  useEffect(() => {
    try {
      const savedParams = localStorage.getItem(FINANCIAL_PARAMS_STORAGE_KEY);
      if (savedParams) {
        const parsed = JSON.parse(savedParams);
        setFinancialParams(parsed);
      }
    } catch (error) {
      console.error("Failed to load financial params from localStorage:", error);
    }
  }, []);

  // Save GPU config to localStorage whenever it changes
  useEffect(() => {
    if (gpuConfig) {
      try {
        localStorage.setItem(GPU_CONFIG_STORAGE_KEY, JSON.stringify(gpuConfig));
      } catch (error) {
        console.error("Failed to save GPU config to localStorage:", error);
      }
    }
  }, [gpuConfig]);

  // Save BTF config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(BTF_CONFIG_STORAGE_KEY, JSON.stringify(btfConfig));
    } catch (error) {
      console.error("Failed to save BTF config to localStorage:", error);
    }
  }, [btfConfig]);

  // Save Financial params to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FINANCIAL_PARAMS_STORAGE_KEY, JSON.stringify(financialParams));
    } catch (error) {
      console.error("Failed to save financial params to localStorage:", error);
    }
  }, [financialParams]);

  return (
    <ConfigContext.Provider
      value={{
        gpuConfig,
        batteryConfig,
        gridConfig,
        btfConfig,
        financialParams,
        setGpuConfig,
        setBatteryConfig,
        setGridConfig,
        setBtfConfig,
        setFinancialParams,
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
