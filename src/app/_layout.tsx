import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { AuditProvider } from '@/context/AuditContext';
import { CatalogProvider } from '@/context/CatalogContext';
import { useAudit } from '@/hooks/useAudit';
import { useCatalog } from '@/hooks/useCatalog';
import { AppThemeProvider, useAppTheme } from '@/theme/theme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootProviders />
    </AppThemeProvider>
  );
}

function RootProviders() {
  const { colors, mode, preference } = useAppTheme();
  const navigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GluestackUIProvider mode={preference}>
      <NavigationThemeProvider value={navigationTheme}>
        <SafeAreaProvider>
          <CatalogProvider>
            <AuditProvider>
              <AppHydrationGate>
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: colors.background },
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text,
                    headerTitleStyle: {
                      color: colors.text,
                      fontWeight: '700',
                    },
                  }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="product/[id]"
                    options={{
                      headerBackTitle: 'Atras',
                      headerShown: true,
                      title: 'Detalle del producto',
                    }}
                  />
                  <Stack.Screen
                    name="audit/[productId]"
                    options={{
                      headerBackTitle: 'Atras',
                      headerShown: true,
                      title: 'Realizar auditoria',
                    }}
                  />
                </Stack>
              </AppHydrationGate>
              <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            </AuditProvider>
          </CatalogProvider>
        </SafeAreaProvider>
      </NavigationThemeProvider>
    </GluestackUIProvider>
  );
}

// Mientras el catalogo (overrides de barcode) y las auditorias terminan de restaurarse desde
// AsyncStorage, se muestra una pantalla breve en vez de dejar ver un Inventario/Bitacora vacios
// que luego "saltan" al llenarse con los datos persistidos.
function AppHydrationGate({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  const { isHydrated: isCatalogHydrated } = useCatalog();
  const { isHydrated: isAuditHydrated } = useAudit();

  if (!isCatalogHydrated || !isAuditHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando inventario...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
