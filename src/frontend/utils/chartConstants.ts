/**
 * Chart styling constants and defaults for consistent visualization across the app.
 * Uses CSS variables from the design system where applicable.
 */

import {
  CHART_BLUE,
  CHART_GREEN,
  CHART_ORANGE,
  CHART_GRID,
  CHART_TOOLTIP_BG,
} from "../ui/chartTheme";

/**
 * Default margin values for Recharts components.
 */
export const CHART_MARGINS = {
  top: 10,
  right: 30,
  bottom: 20,
  left: 40,
} as const;

/**
 * Grid styling defaults for chart backgrounds.
 */
export const GRID_STYLE = {
  stroke: CHART_GRID,
  strokeDasharray: "3 3",
  opacity: 0.5,
} as const;

/**
 * Tooltip styling defaults using theme colors.
 */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: CHART_TOOLTIP_BG,
    border: `1px solid ${CHART_GRID}`,
    borderRadius: "6px",
    padding: "8px 12px",
  },
  labelStyle: {
    fontWeight: 600,
    marginBottom: "4px",
  },
} as const;

/**
 * Primary chart colors from the design system.
 */
export const CHART_COLORS = {
  primary: CHART_BLUE,
  secondary: CHART_GREEN,
  accent: CHART_ORANGE,
  grid: CHART_GRID,
  tooltipBg: CHART_TOOLTIP_BG,
} as const;

/**
 * Common line stroke widths.
 */
export const STROKE_WIDTHS = {
  thin: 1,
  normal: 2,
  thick: 3,
} as const;

/**
 * Common chart heights for consistency.
 */
export const CHART_HEIGHTS = {
  small: 200,
  medium: 300,
  large: 400,
} as const;
