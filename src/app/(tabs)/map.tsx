import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { LocationMap } from '@/components/LocationMap';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAudit } from '@/hooks/useAudit';

export default function MapScreen() {
  const { colors } = useAppTheme();
  const { auditEntries } = useAudit();

  const hasEntries = auditEntries.length > 0;
  const counterLabel = `${auditEntries.length} ${
    auditEntries.length === 1 ? 'registro' : 'registros'
  }`;

  return (
    // scroll={false}: un MapView interactivo (pan/zoom) no debe vivir dentro de un
    // ScrollView, ya que ambos compiten por los gestos de arrastre.
    <AppScreen scroll={false}>
      <View style={styles.header}>
        <SectionHeader title="Mapa" description="Ubicacion de las auditorias realizadas" />

        {hasEntries ? (
          <View style={styles.metaRow}>
            <Text style={[styles.counter, { color: colors.textSecondary }]}>{counterLabel}</Text>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Verificado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Incidencia</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {hasEntries ? (
          <View style={[styles.mapWrapper, { borderColor: colors.border }]}>
            <LocationMap entries={auditEntries} />
          </View>
        ) : (
          <EmptyState
            title="No hay ubicaciones registradas"
            description="Las auditorias realizadas apareceran en el mapa cuando tengan una ubicacion registrada."
            icon={<Ionicons name="map-outline" size={30} color={colors.textSecondary} />}
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 16,
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    gap: 10,
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendLabel: {
    fontSize: 13,
  },
  mapWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
