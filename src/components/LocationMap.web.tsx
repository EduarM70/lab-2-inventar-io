import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { AuditEntry } from '@/types/AuditEntry';

interface LocationMapProps {
  entries: AuditEntry[];
}

// Variante especifica para Expo Web (Metro resuelve este archivo automaticamente en vez de
// LocationMap.tsx cuando platform === 'web', igual que ya hace react-native-maps con MapView.web.ts).
//
// Por que existe este archivo: `react-native-maps` no tiene soporte real en Web (ver limitacion
// documentada en docs/HANDOFF.md), pero el problema NO es solo que el mapa se vea "vacio": su
// archivo `index.ts` reexporta TODOS sus subcomponentes (Marker, Polygon, Circle, etc.) desde un
// unico barrel file. Con el bundler de desarrollo de Metro (`expo start --web`, sin tree-shaking),
// simplemente escribir `import MapView from 'react-native-maps'` evalua ese barrel completo,
// incluyendo especificaciones de Codegen (`src/specs/NativeComponentGooglePolygon.ts`, etc.) que
// llaman a `codegenNativeComponent` de 'react-native' en el nivel superior del modulo. Esa funcion
// no esta implementada en `react-native-web`, lo que produce:
//   TypeError: (0 , _reactNativeWebDistIndex.codegenNativeComponent) is not a function
// y tumba Metro para TODA la app en Web, no solo la pestana Mapa.
//
// La solucion mas segura y de menor complejidad es evitar que 'react-native-maps' se importe en
// absoluto en el bundle Web: este componente nunca lo importa, por lo que Android/iOS siguen
// usando el MapView real (LocationMap.tsx) sin cambios, y Web muestra un estado alternativo simple.
export function LocationMap({ entries }: LocationMapProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="map-outline" size={28} color={colors.textSecondary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        El mapa interactivo no esta disponible en la vista web
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        `react-native-maps` no tiene soporte estable para Expo Web. Abre la app en Android o iOS
        para ver los marcadores de las auditorias en el mapa.
      </Text>
      <Text style={[styles.countText, { color: colors.textSecondary }]}>
        {entries.length} {entries.length === 1 ? 'ubicacion registrada' : 'ubicaciones registradas'}{' '}
        en memoria.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 28,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
    textAlign: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
});
