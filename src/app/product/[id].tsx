import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EditBarcodeModal } from '@/components/EditBarcodeModal';
import { EmptyState } from '@/components/EmptyState';
import { ProductDetail } from '@/components/ProductDetail';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCatalog } from '@/hooks/useCatalog';

export default function ProductDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { products, isBarcodeModified, updateProductBarcode, resetProductBarcode } = useCatalog();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRestoreConfirmVisible, setIsRestoreConfirmVisible] = useState(false);
  const [restoreError, setRestoreError] = useState<string | undefined>();

  // Expo Router puede entregar parametros repetidos como arreglo; la ficha solo acepta un ID.
  const productId = Array.isArray(id) ? id[0] : id;

  // FASE 9: la fuente de verdad en runtime es CatalogContext (initialProducts + overrides
  // persistidos), no products.ts directamente.
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

  const handleConfirmRestore = async () => {
    const result = await resetProductBarcode(product.id);

    if (!result.success) {
      setRestoreError(result.message);
      return;
    }

    setRestoreError(undefined);
    setIsRestoreConfirmVisible(false);
  };

  return (
    <AppScreen edges={['left', 'right', 'bottom']}>
      <ProductDetail
        isBarcodeModified={isBarcodeModified(product.id)}
        onEditBarcode={() => setIsEditModalVisible(true)}
        onRestoreBarcode={() => {
          setRestoreError(undefined);
          setIsRestoreConfirmVisible(true);
        }}
        onStartAudit={handleStartAudit}
        product={product}
      />

      <EditBarcodeModal
        currentBarcode={product.barcode}
        onClose={() => setIsEditModalVisible(false)}
        onSubmit={(barcode) => updateProductBarcode(product.id, barcode)}
        productTitle={product.title}
        visible={isEditModalVisible}
      />

      <ConfirmModal
        confirmLabel="Restaurar"
        description={`Se restaurara el codigo de barras original de ${product.title}.`}
        errorMessage={restoreError}
        onCancel={() => setIsRestoreConfirmVisible(false)}
        onConfirm={handleConfirmRestore}
        title="Restaurar codigo original"
        visible={isRestoreConfirmVisible}
      />
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
