import { AuditActionType } from "@/types/AuditEntry";

const actionTypeLabels: Record<AuditActionType, string> = {
  AUDIT_CHECK: "Stock verificado",
  INCIDENCE: "Incidencia",
  STOCK_RECEIPT: "Recepcion de stock",
};

export function getActionTypeLabel(actionType: AuditActionType): string {
  return actionTypeLabels[actionType];
}
