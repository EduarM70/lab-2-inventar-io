import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { AuditProvider } from '@/context/AuditContext';
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
          <AuditProvider>
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
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          </AuditProvider>
        </SafeAreaProvider>
      </NavigationThemeProvider>
    </GluestackUIProvider>
  );
}
