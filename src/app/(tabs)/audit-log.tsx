import { Ionicons } from '@expo/vector-icons';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AuditLogScreen() {
  const { colors } = useAppTheme();

  return (
    <AppScreen>
      <SectionHeader
        title="Bitacora"
        description="Historial de auditorias e incidencias"
      />

      <EmptyState
        title="Aun no hay movimientos registrados"
        description="Las auditorias realizadas apareceran aqui."
        icon={<Ionicons name="clipboard-outline" size={30} color={colors.textSecondary} />}
      />
    </AppScreen>
  );
}
