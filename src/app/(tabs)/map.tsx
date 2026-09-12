import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function MapScreen() {
  const { colors } = useAppTheme();

  return (
    <AppScreen>
      <SectionHeader
        title="Mapa"
        description="Ubicacion de las auditorias realizadas"
      />

      <View
        style={[
          styles.mapPlaceholder,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.grid}>
          <View style={[styles.gridLineHorizontal, { backgroundColor: colors.border }]} />
          <View style={[styles.gridLineVertical, { backgroundColor: colors.border }]} />
          <View style={[styles.pin, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="location-outline" size={34} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>No existen ubicaciones registradas</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Las auditorias georreferenciadas se visualizaran aqui en otra fase.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 280,
    textAlign: 'center',
  },
  grid: {
    alignItems: 'center',
    aspectRatio: 1.6,
    justifyContent: 'center',
    maxWidth: 340,
    overflow: 'hidden',
    width: '100%',
  },
  gridLineHorizontal: {
    height: 1,
    opacity: 0.9,
    position: 'absolute',
    width: '100%',
  },
  gridLineVertical: {
    height: '100%',
    opacity: 0.9,
    position: 'absolute',
    width: 1,
  },
  mapPlaceholder: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    minHeight: 360,
    padding: 24,
  },
  pin: {
    alignItems: 'center',
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
});
