import { AuditActionType } from '@/types/AuditEntry';

export type AuditDraftActionType = Extract<AuditActionType, 'AUDIT_CHECK' | 'INCIDENCE'>;

export interface AuditDraft {
  productId: string;
  productTitle: string;
  actionType: AuditDraftActionType;
  audioNoteUrl?: string;
}
