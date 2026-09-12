import { createContext, PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { AuditEntry } from '@/types/AuditEntry';

interface AuditContextValue {
  auditEntries: AuditEntry[];
  addAuditEntry: (entry: AuditEntry) => void;
}

export const AuditContext = createContext<AuditContextValue | undefined>(undefined);

export function AuditProvider({ children }: PropsWithChildren) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  const addAuditEntry = useCallback((entry: AuditEntry) => {
    setAuditEntries((currentEntries) => [...currentEntries, entry]);
  }, []);

  const value = useMemo<AuditContextValue>(
    () => ({
      auditEntries,
      addAuditEntry,
    }),
    [addAuditEntry, auditEntries],
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}
