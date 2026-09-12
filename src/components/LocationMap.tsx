import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, LatLng, Marker, Region } from 'react-native-maps';

import { lightColors } from '@/theme/colors';
import { AuditActionType, AuditEntry } from '@/types/AuditEntry';
import { getActionTypeLabel } from '@/utils/actionLabels';
import { formatDateTime } from '@/utils/formatDateTime';
import { isValidCoordinate } from '@/utils/isValidCoordinate';

interface LocationMapProps {
  entries: AuditEntry[];
}

// Nivel de zoom razonable para centrar un unico registro (aprox. una manzana/bodega).
const SINGLE_ENTRY_DELTA = 0.01;

// Region neutral usada unicamente si, por un error de datos, ninguna entrada tuviera
// coordenadas validas. No representa un lugar real, solo evita que el mapa quede sin region.
const FALLBACK_REGION: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 60,
  longitudeDelta: 60,
};

const FIT_EDGE_PADDING = { top: 64, right: 64, bottom: 64, left: 64 };

function getPinColor(actionType: AuditActionType): string {
  switch (actionType) {
    case 'INCIDENCE':
      return lightColors.danger;
    case 'STOCK_RECEIPT':
      return lightColors.primary;
    case 'AUDIT_CHECK':
    default:
      return lightColors.success;
  }
}

// Componente puramente de presentacion geografica: no conoce AuditContext, no obtiene GPS,
// no graba audio y no conoce products.ts. Recibe los AuditEntry ya guardados via props y
// unicamente los coloca en el mapa.
export function LocationMap({ entries }: LocationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const validEntries = useMemo(() => {
    return entries.filter((entry) => {
      const valid = isValidCoordinate(entry.location.latitude, entry.location.longitude);

      if (!valid && __DEV__) {
        console.warn(`LocationMap: se omitio el registro ${entry.id} por coordenadas invalidas`);
      }

      return valid;
    });
  }, [entries]);

  const coordinates = useMemo<LatLng[]>(
    () =>
      validEntries.map((entry) => ({
        latitude: entry.location.latitude,
        longitude: entry.location.longitude,
      })),
    [validEntries],
  );

  const initialRegion = useMemo<Region>(() => {
    if (coordinates.length === 0) {
      return FALLBACK_REGION;
    }

    // Para 1 o varios registros, la carga inicial centra en el primero disponible.
    // Cuando existen 2+ registros, el ajuste fino ocurre luego mediante fitToCoordinates.
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: SINGLE_ENTRY_DELTA,
      longitudeDelta: SINGLE_ENTRY_DELTA,
    };
  }, [coordinates]);

  // Ajusta el viewport para mostrar todos los marcadores cuando hay 2 o mas registros.
  // Se ejecuta cuando el mapa termina de cargar y cada vez que cambian las coordenadas
  // (por ejemplo, al regresar de registrar una nueva auditoria).
  useEffect(() => {
    if (!isMapReady || coordinates.length < 2) {
      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: FIT_EDGE_PADDING,
      animated: true,
    });
  }, [isMapReady, coordinates]);

  return (
    <MapView
      initialRegion={initialRegion}
      onMapReady={() => setIsMapReady(true)}
      ref={mapRef}
      style={styles.map}>
      {validEntries.map((entry) => (
        <Marker
          coordinate={{ latitude: entry.location.latitude, longitude: entry.location.longitude }}
          key={entry.id}
          pinColor={getPinColor(entry.actionType)}>
          <Callout>
            <View style={styles.callout}>
              <Text numberOfLines={2} style={styles.calloutTitle}>
                {entry.productTitle}
              </Text>
              <Text style={[styles.calloutAction, { color: getPinColor(entry.actionType) }]}>
                {getActionTypeLabel(entry.actionType)}
              </Text>
              <Text style={styles.calloutMeta}>{formatDateTime(entry.timestamp)}</Text>
              <Text style={styles.calloutMeta}>
                {entry.location.latitude.toFixed(5)}, {entry.location.longitude.toFixed(5)}
              </Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  callout: {
    gap: 3,
    maxWidth: 220,
    padding: 4,
  },
  // El globo (Callout) del proveedor nativo del mapa se renderiza con fondo claro
  // independientemente del tema de la app (limitacion documentada), por lo que aqui se
  // usan colores fijos de la paleta clara en vez de useAppTheme() para garantizar contraste.
  calloutAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  calloutMeta: {
    color: lightColors.textSecondary,
    fontSize: 12,
  },
  calloutTitle: {
    color: lightColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  map: {
    flex: 1,
  },
});
