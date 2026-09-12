import * as Location from 'expo-location';
import { useCallback } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationErrorKind = 'permission-denied' | 'unavailable';

export class LocationRequestError extends Error {
  readonly kind: LocationErrorKind;
  readonly canAskAgain: boolean;

  constructor(kind: LocationErrorKind, message: string, canAskAgain = true) {
    super(message);
    this.name = 'LocationRequestError';
    this.kind = kind;
    this.canAskAgain = canAskAgain;
  }
}

interface UseCurrentLocationResult {
  getCurrentLocation: () => Promise<Coordinates>;
}

// Hook aislado de AuditContext: su unica responsabilidad es hablar con el hardware de
// ubicacion (permiso foreground + posicion actual) y devolver coordenadas reales o un error tipado.
export function useCurrentLocation(): UseCurrentLocationResult {
  const getCurrentLocation = useCallback(async (): Promise<Coordinates> => {
    const permissionResponse = await Location.requestForegroundPermissionsAsync();

    if (permissionResponse.status !== Location.PermissionStatus.GRANTED) {
      throw new LocationRequestError(
        'permission-denied',
        'Se necesita acceso a la ubicacion',
        permissionResponse.canAskAgain,
      );
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      return { latitude, longitude };
    } catch (error: unknown) {
      throw new LocationRequestError('unavailable', 'No pudimos obtener tu ubicacion');
    }
  }, []);

  return { getCurrentLocation };
}
