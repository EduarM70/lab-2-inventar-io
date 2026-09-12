import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface ProductImageProps {
  uri: string;
  accessibilityLabel: string;
  variant?: 'card' | 'detail';
}

function ProductImageComponent({
  uri,
  accessibilityLabel,
  variant = 'card',
}: ProductImageProps) {
  const { colors } = useAppTheme();
  const [hasImageError, setHasImageError] = useState(false);
  const isDetail = variant === 'detail';

  useEffect(() => {
    setHasImageError(false);
  }, [uri]);

  return (
    <View
      style={[
        styles.container,
        isDetail ? styles.detailContainer : styles.cardContainer,
        { backgroundColor: colors.surfaceSecondary },
      ]}>
      {hasImageError ? (
        <View style={styles.fallback}>
          <Ionicons
            name="cube-outline"
            size={isDetail ? 54 : 34}
            color={colors.textSecondary}
          />
        </View>
      ) : (
        <Image
          accessibilityLabel={accessibilityLabel}
          source={{ uri }}
          onError={() => setHasImageError(true)}
          resizeMode="cover"
          style={styles.image}
        />
      )}
    </View>
  );
}

export const ProductImage = memo(ProductImageComponent);

const styles = StyleSheet.create({
  cardContainer: {
    height: 94,
    width: 94,
  },
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailContainer: {
    aspectRatio: 1.55,
    width: '100%',
  },
  fallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
