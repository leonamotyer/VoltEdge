/**
 * Number formatting utilities for charts, tables, and displays.
 */

/**
 * Format a number to a fixed number of decimal places.
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function decimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format a number as CAD currency.
 * @param value - The number to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function currency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

/**
 * Format a number as a percentage.
 * @param value - The number to format (e.g., 0.85 for 85%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "85.0%")
 */
export function percentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format energy values in MWh.
 * @param value - Energy value in MWh
 * @returns Formatted string with MWh suffix (e.g., "123.4 MWh")
 */
export function energy(value: number): string {
  return `${value.toFixed(1)} MWh`;
}

/**
 * Format power values in MW.
 * @param value - Power value in MW
 * @returns Formatted string with MW suffix (e.g., "12.3 MW")
 */
export function power(value: number): string {
  return `${value.toFixed(1)} MW`;
}
