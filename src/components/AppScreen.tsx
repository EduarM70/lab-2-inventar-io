import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';

interface AppScreenProps extends PropsWithChildren {
  scroll?: boolean;
}

export function AppScreen({ children, scroll = true }: AppScreenProps) {
  const { colors } = useAppTheme();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fixedContent}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
