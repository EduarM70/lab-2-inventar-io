import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ScannerScreen() {
  const { colors } = useAppTheme();

  return (
    <AppScreen>
      <SectionHeader
        title="Escaner"
        description="Escanea el codigo de barras de un producto"
      />

      <View
        style={[
          styles.preview,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={[styles.scanFrame, { borderColor: colors.primary }]}>
          <Ionicons name="barcode-outline" size={68} color={colors.primary} />
        </View>
        <Text style={[styles.message, { color: colors.text }]}>
          El escaner estara disponible proximamente
        </Text>
        <Text style={[styles.detail, { color: colors.textSecondary }]}>
          La camara y los permisos se activaran en una fase posterior.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  detail: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 260,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  preview: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    justifyContent: 'center',
    minHeight: 360,
    overflow: 'hidden',
    padding: 28,
  },
  scanFrame: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    height: 150,
    justifyContent: 'center',
    width: '72%',
  },
});
