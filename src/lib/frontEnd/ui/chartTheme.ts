/**
 * Chart hex values — keep in sync with accent tokens in `src/app/globals.css`.
 */
export const CHART_BLUE = "#2563eb";
export const CHART_TEAL = "#10b981";
export const CHART_CYAN = "#06b6d4";
export const CHART_GRID = "#e2e8f0";
export const CHART_TOOLTIP_BG = "#f8fafc";

/** Pie / multi-series — blue–green first, neutral + alert last. */
export const CHART_PIE_COLORS = [CHART_BLUE, CHART_TEAL, CHART_CYAN, "#64748b", "#ef4444"] as const;
