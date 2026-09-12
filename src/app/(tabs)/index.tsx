import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCatalog } from '@/hooks/useCatalog';
import { Product } from '@/types/Product';

export default function InventoryScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { products } = useCatalog();
  const [searchQuery, setSearchQuery] = useState('');

  const inventoryStats = useMemo(() => {
    const totalExpectedStock = products.reduce(
      (stockTotal, product) => stockTotal + product.expectedStock,
      0,
    );
    const categoryCount = new Set(products.map((product) => product.category)).size;

    return {
      categoryCount,
      productCount: products.length,
      totalExpectedStock,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    // Normalizar una sola vez por producto mantiene la busqueda case-insensitive sin repetir filtros.
    return products.filter((product) => {
      const searchableContent = `${product.title} ${product.category} ${product.barcode}`.toLowerCase();

      return searchableContent.includes(normalizedQuery);
    });
  }, [products, searchQuery]);

  const resultLabel =
    searchQuery.trim().length > 0
      ? `${filteredProducts.length} productos encontrados`
      : `${products.length} productos`;

  const renderProduct = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <ProductCard
        product={item}
        onPress={() =>
          router.push({
            pathname: '/product/[id]',
            params: { id: item.id },
          })
        }
      />
    ),
    [router],
  );

  return (
    <AppScreen scroll={false}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(product) => product.id}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <SectionHeader
              title="Inventario"
              description="Consulta y auditoria de productos en bodega"
            />

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nombre, categoria o codigo..."
            />

            <View style={styles.statsRow}>
              <StatCard
                label="Productos"
                value={inventoryStats.productCount}
                icon={<Ionicons name="cube-outline" size={20} color={colors.primary} />}
              />
              <StatCard
                label="Unidades esperadas"
                value={inventoryStats.totalExpectedStock}
                icon={<Ionicons name="layers-outline" size={20} color={colors.success} />}
              />
              <StatCard
                label="Categorias"
                value={inventoryStats.categoryCount}
                icon={<Ionicons name="pricetags-outline" size={20} color={colors.warning} />}
              />
            </View>

            <View style={styles.catalogHeader}>
              <Text style={[styles.catalogTitle, { color: colors.text }]}>Catalogo</Text>
              <Text style={[styles.catalogCount, { color: colors.textSecondary }]}>
                {resultLabel}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No encontramos productos"
            description="No existen productos que coincidan con tu busqueda. Intenta buscar por nombre, categoria o codigo."
            icon={<Ionicons name="search-outline" size={30} color={colors.textSecondary} />}
          />
        }
        ItemSeparatorComponent={ProductSeparator}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        />
    </AppScreen>
  );
}

function ProductSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  catalogCount: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  catalogHeader: {
    gap: 2,
  },
  catalogTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  headerContent: {
    gap: 20,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  separator: {
    height: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
