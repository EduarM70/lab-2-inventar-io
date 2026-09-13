// Los overrides de barcode se persisten como { [productId]: barcode }. Esta validacion minima
// evita restaurar datos corruptos o con forma inesperada como si fueran overrides validos.
export function isBarcodeOverrides(
  value: unknown,
): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "string");
}
