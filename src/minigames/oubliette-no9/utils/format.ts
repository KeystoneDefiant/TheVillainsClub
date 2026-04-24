/**
 * Format a credit amount with thousands separators (e.g. 5000 → "5,000").
 */
export function formatCredits(amount: number): string {
  return amount.toLocaleString();
}

/**
 * Format credits for display with "credits" suffix (e.g. 5000 → "5,000 credits").
 */
export function formatCreditsWithSuffix(amount: number): string {
  return `${amount.toLocaleString()} credits`;
}
