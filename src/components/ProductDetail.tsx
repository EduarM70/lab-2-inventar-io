import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from '@/components/ProductImage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Product } from '@/types/Product';
import { formatCurrency } from '@/utils/formatCurrency';

interface ProductDetailProps {
  product: Product;
  onStartAudit: () => void;
}

export function ProductDetail({ product, onStartAudit }: ProductDetailProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <ProductImage
        accessibilityLabel={`Imagen de ${product.title}`}
        uri={product.imageUrl}
        variant="detail"
      />

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>
        <View style={[styles.categoryChip, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
          <Text style={[styles.categoryText, { color: colors.primary }]}>{product.category}</Text>
        </View>
      </View>

      <View style={styles.sections}>
        <InfoSection title="Inventario">
          <InfoRow
            icon="layers-outline"
            label="Stock esperado"
            value={`${product.expectedStock} unidades`}
          />
        </InfoSection>

        <InfoSection title="Precio">
          <InfoRow
            icon="cash-outline"
            label="Precio unitario"
            value={formatCurrency(product.unitPrice)}
          />
        </InfoSection>

        <InfoSection title="Identificacion">
          <View
            style={[
              styles.barcodeBox,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Codigo de barras
            </Text>
            <Text style={[styles.barcodeValue, { color: colors.text }]}>{product.barcode}</Text>
          </View>
        </InfoSection>
      </View>

      <Pressable
        accessibilityLabel="Realizar auditoria"
        accessibilityRole="button"
        onPress={onStartAudit}
        style={({ pressed }) => [
          styles.auditButton,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <Ionicons name="clipboard-outline" size={20} color="#FFFFFF" />
        <Text style={styles.auditButtonText}>Realizar auditoria</Text>
      </Pressable>
    </View>
  );
}

interface InfoSectionProps {
  children: React.ReactNode;
  title: string;
}

function InfoSection({ children, title }: InfoSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  auditButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  auditButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  barcodeBox: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  barcodeValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 22,
  },
  categoryChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  container: {
    gap: 20,
  },
  infoIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  sections: {
    gap: 12,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 34,
  },
  titleBlock: {
    gap: 10,
  },
});
