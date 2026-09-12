const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  style: 'currency',
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}
