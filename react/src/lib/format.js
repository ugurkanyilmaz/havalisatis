// Currency and number formatting helpers
export function formatTRY(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  // Show without currency symbol, append ' TL' manually to match current UI
  // Use tr-TR locale so 31747 => 31.747
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

export function formatPriceTL(value) {
  const s = formatTRY(value);
  return s ? `${s} TL` : '';
}
