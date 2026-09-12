import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { ProductImage } from '@/components/ProductImage';
import { Product } from '@/types/Product';
import { formatCurrency } from '@/utils/formatCurrency';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

function ProductCardComponent({ product, onPress }: ProductCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={`${product.title}, ${product.category}, stock esperado ${product.expectedStock}`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed && onPress ? colors.surfaceSecondary : colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <ProductImage
        accessibilityLabel={`Imagen de ${product.title}`}
        uri={product.imageUrl}
      />

      <View style={styles.content}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>
            {product.category}
          </Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Codigo</Text>
            <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
              {product.barcode}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Precio</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {formatCurrency(product.unitPrice)}
            </Text>
          </View>
        </View>

        <View style={[styles.stockBadge, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="layers-outline" size={16} color={colors.success} />
          <Text style={[styles.stockText, { color: colors.text }]}>
            Stock esperado: {product.expectedStock} unidades
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardComponent);

const styles = StyleSheet.create({
  category: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 12,
  },
  content: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  stockBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    minHeight: 30,
    paddingHorizontal: 10,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  titleGroup: {
    gap: 3,
  },
});
