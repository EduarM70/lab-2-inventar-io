export type AuditActionType =
  | 'AUDIT_CHECK'
  | 'INCIDENCE'
  | 'STOCK_RECEIPT';

export interface AuditEntry {
  id: string;
  productId: string;
  productTitle: string;
  timestamp: string;
  actionType: AuditActionType;
  audioNoteUrl?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}
