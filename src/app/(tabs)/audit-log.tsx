import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { AuditLogItem } from '@/components/AuditLogItem';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { useAudit } from '@/hooks/useAudit';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AuditLogScreen() {
  const { colors } = useAppTheme();
  const { auditEntries } = useAudit();

  // No se muta ni se ordena el arreglo original de AuditContext: se crea una copia
  // invertida solo para mostrar los registros mas recientes primero.
  const orderedEntries = [...auditEntries].reverse();

  return (
    <AppScreen>
      <SectionHeader title="Bitacora" description="Historial de auditorias e incidencias" />

      {orderedEntries.length === 0 ? (
        <EmptyState
          title="Aun no hay movimientos registrados"
          description="Las auditorias realizadas apareceran aqui."
          icon={<Ionicons name="clipboard-outline" size={30} color={colors.textSecondary} />}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {orderedEntries.map((entry) => (
            <AuditLogItem entry={entry} key={entry.id} />
          ))}
        </View>
      )}
    </AppScreen>
  );
}
