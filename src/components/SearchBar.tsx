import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar producto...',
}: SearchBarProps) {
  const { colors } = useAppTheme();
  const showClearButton = value.length > 0;

  return (
    <View
      accessibilityLabel={placeholder}
      accessibilityRole="search"
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
        value={value}
      />
      {showClearButton ? (
        <Pressable
          accessibilityLabel="Limpiar busqueda"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  clearButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  input: {
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingVertical: 0,
    lineHeight: 20,
  },
});
