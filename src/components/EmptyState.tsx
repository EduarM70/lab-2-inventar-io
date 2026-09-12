import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>{icon}</View>
      ) : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    justifyContent: 'center',
    minHeight: 260,
    padding: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 280,
    textAlign: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginBottom: 4,
    width: 56,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
});
