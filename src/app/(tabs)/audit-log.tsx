import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { useAudit } from '@/hooks/useAudit';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AuditLogScreen() {
  const { colors } = useAppTheme();
  const { auditEntries } = useAudit();

  return (
    <AppScreen>
      <SectionHeader
        title="Bitacora"
        description="Historial de auditorias e incidencias"
      />

      {auditEntries.length === 0 ? (
        <EmptyState
          title="Aun no hay movimientos registrados"
          description="Las auditorias realizadas apareceran aqui."
          icon={<Ionicons name="clipboard-outline" size={30} color={colors.textSecondary} />}
        />
      ) : (
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="clipboard-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.countText, { color: colors.text }]}>
              {auditEntries.length} movimientos
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              La bitacora detallada se completara en una siguiente fase.
            </Text>
          </View>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  countText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  summaryCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
});
