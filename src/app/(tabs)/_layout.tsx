import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useAppTheme } from '@/hooks/useAppTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icons: Record<string, IconName> = {
  index: 'cube-outline',
  scanner: 'barcode-outline',
  'audit-log': 'clipboard-outline',
  map: 'map-outline',
};

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={icons[route.name]} size={focused ? 24 : 22} color={color} />
        ),
      })}>
      <Tabs.Screen name="index" options={{ title: 'Inventario' }} />
      <Tabs.Screen name="scanner" options={{ title: 'Escaner' }} />
      <Tabs.Screen name="audit-log" options={{ title: 'Bitacora' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
    </Tabs>
  );
}
