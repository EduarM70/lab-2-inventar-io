import { AuditActionType, AuditEntry } from '@/types/AuditEntry';

const VALID_ACTION_TYPES: AuditActionType[] = ['AUDIT_CHECK', 'INCIDENCE', 'STOCK_RECEIPT'];

// Validacion minima (no un esquema completo) de un valor desconocido leido de AsyncStorage,
// para evitar restaurar datos corruptos o con forma inesperada como si fueran un AuditEntry real.
export function isAuditEntry(value: unknown): value is AuditEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
    return false;
  }

  if (typeof candidate.productId !== 'string' || candidate.productId.length === 0) {
    return false;
  }

  if (typeof candidate.productTitle !== 'string') {
    return false;
  }

  if (typeof candidate.timestamp !== 'string') {
    return false;
  }

  if (
    typeof candidate.actionType !== 'string' ||
    !VALID_ACTION_TYPES.includes(candidate.actionType as AuditActionType)
  ) {
    return false;
  }

  if (candidate.audioNoteUrl !== undefined && typeof candidate.audioNoteUrl !== 'string') {
    return false;
  }

  const location = candidate.location as Record<string, unknown> | undefined;

  if (
    typeof location !== 'object' ||
    location === null ||
    typeof location.latitude !== 'number' ||
    typeof location.longitude !== 'number'
  ) {
    return false;
  }

  return true;
}

export function isAuditEntryArray(value: unknown): value is AuditEntry[] {
  return Array.isArray(value) && value.every(isAuditEntry);
}
