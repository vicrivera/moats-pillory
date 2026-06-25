const WEI_DIVISOR = 10n ** 18n;

export function parseBigInt(value: string | null | undefined): bigint {
  if (!value) return 0n;
  try { return BigInt(value); } catch { return 0n; }
}

/**
 * Format 18-decimal wei to human-readable with compact notation.
 * 1_500_000_000_000_000_000_000n → "1.50K"
 */
export function formatWei(value: bigint, decimals = 2): string {
  if (value === 0n) return '0';
  const float = Number(value) / Number(WEI_DIVISOR);
  if (float >= 1_000_000) return `${(float / 1_000_000).toFixed(decimals)}M`;
  if (float >= 1_000)     return `${(float / 1_000).toFixed(decimals)}K`;
  return float.toFixed(decimals);
}

/**
 * Format avg_fee_percent_scaled (integer ×100) to display string.
 * 6750 → "67.50%"
 */
export function formatFeePercent(scaled: number): string {
  const whole = Math.floor(scaled / 100);
  const frac  = scaled % 100;
  return `${whole}.${String(frac).padStart(2, '0')}%`;
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

export const snowtrace = {
  tx:      (hash: string)    => `https://snowtrace.io/tx/${hash}`,
  address: (address: string) => `https://snowtrace.io/address/${address}`,
};
