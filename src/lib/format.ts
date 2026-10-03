/**
 * Currency and progress formatting utilities for production
 */

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProgress(
  raised: number | null | undefined,
  needed: number | null | undefined
): number {
  const r = Number(raised) || 0;
  const n = Number(needed) || 1;
  if (n <= 0) return 100;
  return Math.min(100, Math.round((r / n) * 100));
}
