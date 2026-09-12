import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { AuditEntry } from '@/types/AuditEntry';
import { isAuditEntryArray } from '@/utils/isValidAuditEntry';

interface AuditContextValue {
  auditEntries: AuditEntry[];
  addAuditEntry: (entry: AuditEntry) => void;
  isHydrated: boolean;
}

export const AuditContext = createContext<AuditContextValue | undefined>(undefined);

export function AuditProvider({ children }: PropsWithChildren) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratacion: se ejecuta una sola vez al montar. Solo despues de terminar (exito o error)
  // se marca isHydrated = true, para que el efecto de persistencia de abajo no alcance a
  // sobreescribir el storage con el arreglo inicial vacio antes de leerlo.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_ENTRIES);

        if (raw) {
          const parsed: unknown = JSON.parse(raw);

          if (isAuditEntryArray(parsed)) {
            if (!cancelled) {
              setAuditEntries(parsed);
            }
          } else if (__DEV__) {
            console.warn('AuditContext: auditEntries con formato invalido, se ignoran.');
          }
        }
      } catch (error: unknown) {
        if (__DEV__) {
          console.warn('AuditContext: no se pudieron leer las auditorias guardadas.', error);
        }

        // Datos corruptos: se limpia la clave y se continua con un arreglo vacio seguro
        // (nunca se deja la app inutilizable).
        await AsyncStorage.removeItem(STORAGE_KEYS.AUDIT_ENTRIES).catch(() => undefined);
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persistencia: solo se activa despues de que la hidratacion inicial termino.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEYS.AUDIT_ENTRIES, JSON.stringify(auditEntries)).catch(
      (error: unknown) => {
        if (__DEV__) {
          console.warn('AuditContext: no se pudieron persistir las auditorias.', error);
        }
      },
    );
  }, [auditEntries, isHydrated]);

  const addAuditEntry = useCallback((entry: AuditEntry) => {
    setAuditEntries((currentEntries) => [...currentEntries, entry]);
  }, []);

  const value = useMemo<AuditContextValue>(
    () => ({
      auditEntries,
      addAuditEntry,
      isHydrated,
    }),
    [addAuditEntry, auditEntries, isHydrated],
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}
