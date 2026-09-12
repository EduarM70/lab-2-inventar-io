import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { ProductDetail } from '@/components/ProductDetail';
import { products } from '@/data/products';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ProductDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  // Expo Router puede entregar parametros repetidos como arreglo; la ficha solo acepta un ID.
  const productId = Array.isArray(id) ? id[0] : id;

  // La fuente de verdad sigue siendo products.ts para que catalogo y scanner reutilicen esta ruta.
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return (
      <AppScreen edges={['left', 'right', 'bottom']}>
        <EmptyState
          title="Producto no encontrado"
          description="El producto solicitado no existe en el catalogo."
          icon={<Ionicons name="alert-circle-outline" size={30} color={colors.textSecondary} />}
        />
        <Pressable
          accessibilityLabel="Volver al inventario"
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Volver al inventario</Text>
        </Pressable>
      </AppScreen>
    );
  }

  const handleStartAudit = () => {
    router.push({
      pathname: '/audit/[productId]',
      params: { productId: product.id },
    });
  };

  return (
    <AppScreen edges={['left', 'right', 'bottom']}>
      <ProductDetail product={product} onStartAudit={handleStartAudit} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});
