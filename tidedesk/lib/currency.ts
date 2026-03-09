const CURRENCY_SYMBOLS: Record<string, string> = {
  NZD: "NZ$",
  AUD: "A$",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatCurrency(amount: number, currency?: string | null): string {
  const symbol = (currency && CURRENCY_SYMBOLS[currency]) || "NZ$";
  return `${symbol}${amount.toFixed(2)}`;
}
