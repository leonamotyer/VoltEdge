import type { AesoHourlyMarketRecord } from "../aeso/aesoRepository";
import type { ScadaHourlyRecord } from "../scada/scadaRepository";
import type { TurbineRecord } from "../turbine/turbineRepository";

/**
 * AESO market data repository interface.
 * Provides hourly pool price and generation data.
 */
export interface IAesoRepository {
  getDemoHourlyMarket(): AesoHourlyMarketRecord[];
  getExportSnapshot(): {
    repository: string;
    dataSource: string;
    doc: string;
    portal: string;
    note: string;
    hourlyMarket: AesoHourlyMarketRecord[];
  };
}

/**
 * SCADA telemetry repository interface.
 * Provides site wind speed and other sensor data.
 */
export interface IScadaRepository {
  getDemoHourlyScada(): ScadaHourlyRecord[];
  getExportSnapshot(): {
    repository: string;
    dataSource: string;
    doc: string;
    note: string;
    hourlyScada: ScadaHourlyRecord[];
  };
}

/**
 * Turbine database repository interface.
 * Provides turbine specifications and site configuration.
 */
export interface ITurbineRepository {
  getDemoRecords(): TurbineRecord[];
  getCountForSite(siteId: string): number;
  getExportSnapshot(): {
    repository: string;
    dataSource: string;
    doc: string;
    dataset: string;
    mapService: string;
    note: string;
    turbines: TurbineRecord[];
  };
}
