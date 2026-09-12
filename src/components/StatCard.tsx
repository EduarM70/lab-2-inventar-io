import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 112,
    padding: 14,
  },
  icon: {
    minHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
});
