// Claves centralizadas de AsyncStorage. El sufijo .v1 permite versionar el formato
// guardado si en el futuro cambia la forma de los datos persistidos.
export const STORAGE_KEYS = {
  AUDIT_ENTRIES: 'inventory.auditEntries.v1',
  BARCODE_OVERRIDES: 'inventory.barcodeOverrides.v1',
} as const;
