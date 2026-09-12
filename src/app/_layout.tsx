import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
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
  const { mode, preference } = useAppTheme();
  const navigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GluestackUIProvider mode={preference}>
      <NavigationThemeProvider value={navigationTheme}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        </SafeAreaProvider>
      </NavigationThemeProvider>
    </GluestackUIProvider>
  );
}
