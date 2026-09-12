import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function NotFoundScreen() {
  const { colors } = useAppTheme();

  return (
    <AppScreen scroll={false}>
      <Text style={[styles.title, { color: colors.text }]}>Ruta no encontrada</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Esta pantalla no existe en inventar.io.
      </Text>
      <Link href="/" style={[styles.link, { color: colors.primary }]}>
        Volver al inventario
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    marginTop: 8,
  },
  link: {
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginTop: 24,
  },
});
