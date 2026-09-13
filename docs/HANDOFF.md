# inventar.io - Documento De Continuidad

Este documento resume el estado actual de la app movil academica `inventar.io` para que otra persona o IA pueda continuar el desarrollo sin reconstruir el contexto de las fases anteriores.

## Estado General

`inventar.io` es una app de auditoria y control de inventario en bodega construida con React Native, Expo SDK 57, TypeScript estricto y Expo Router usando `src/app` como raiz de rutas.

La app ya cuenta con:

- Navegacion por tabs: Inventario, Escaner, Bitacora y Mapa.
- Rutas secundarias fuera de tabs para detalle de producto y auditoria.
- Tema centralizado con Light Mode y Dark Mode.
- Gluestack UI y UniWind configurados.
- Catalogo de productos gestionado por `CatalogContext` (semilla en `src/data/products.ts`), con edicion de codigo de barras persistida en `AsyncStorage`.
- Scanner real de codigos con `expo-camera`, integrado al catalogo global (reconoce codigos editados sin reiniciar).
- Auditorias con GPS real (`expo-location`), notas de voz opcionales (`expo-audio`) y mapa georreferenciado (`react-native-maps`), todo con estado global via Context API.
- Persistencia local con `AsyncStorage` para auditorias y catalogo, con estados de hidratacion y pantalla de carga inicial.

## Stack Y Dependencias

Versiones principales actuales:

- `expo`: `~57.0.22`
- `expo-router`: `~57.0.21`
- `expo-camera`: `~57.0.5`
- `expo-location`: `~57.0.17`
- `expo-audio`: `~57.0.5`
- `react-native-maps`: `1.27.2`
- `@react-native-async-storage/async-storage`: `2.2.0`
- `react`: `19.2.3`
- `react-native`: `0.86.3`
- `typescript`: `~6.0.3`
- `@expo/vector-icons`
- `@gluestack-ui/core`
- `@gluestack-ui/utils`
- `uniwind`

Scripts disponibles:

```bash
npm run typecheck
npm run start
npm run android
npm run ios
npm run web
```

No existe script de lint configurado actualmente.

## Arquitectura Actual

La aplicacion usa Expo Router con estas rutas principales:

- `src/app/(tabs)/index.tsx`: Inventario.
- `src/app/(tabs)/scanner.tsx`: Escaner.
- `src/app/(tabs)/audit-log.tsx`: Bitacora.
- `src/app/(tabs)/map.tsx`: Mapa con `MapView` real (FASE 8).
- `src/app/product/[id].tsx`: Detalle de producto.
- `src/app/audit/[productId].tsx`: Flujo inicial de auditoria.
- `src/app/_layout.tsx`: Stack raiz y providers globales.

Providers globales actuales (orden real en `src/app/_layout.tsx`):

- `AppThemeProvider`
- `GluestackUIProvider`
- `NavigationThemeProvider`
- `SafeAreaProvider`
- `CatalogProvider` (FASE 9)
- `AuditProvider`
- `AppHydrationGate` (FASE 9, componente interno de `_layout.tsx`, no es un Context)

No se deben duplicar providers. Cualquier nuevo estado global debe integrarse con cuidado en `src/app/_layout.tsx`.

`AppHydrationGate` no renderiza el `Stack` (ninguna pantalla) hasta que `useCatalog().isHydrated` y `useAudit().isHydrated` sean `true`; mientras tanto muestra una pantalla breve "Cargando inventario..." con `ActivityIndicator`. Esto evita que Inventario/Bitacora se vean vacios por un instante y luego "salten" al llenarse con los datos restaurados de `AsyncStorage`.

## Tema Visual

El tema vive en `src/theme` y se consume desde `useAppTheme`.

Tokens semanticos disponibles:

- `background`
- `surface`
- `surfaceSecondary`
- `text`
- `textSecondary`
- `border`
- `primary`
- `success`
- `warning`
- `danger`

Regla importante: las pantallas nuevas deben usar estos tokens para mantener soporte Light/Dark Mode. Evitar colores hardcodeados salvo casos controlados como texto blanco sobre boton primario.

## Tipos De Dominio

`Product` esta en `src/types/Product.ts`:

```ts
export interface Product {
  id: string;
  title: string;
  category: string;
  barcode: string;
  imageUrl: string;
  expectedStock: number;
  unitPrice: number;
}
```

`AuditEntry` esta en `src/types/AuditEntry.ts`:

```ts
export type AuditActionType =
  | 'AUDIT_CHECK'
  | 'INCIDENCE'
  | 'STOCK_RECEIPT';

export interface AuditEntry {
  id: string;
  productId: string;
  productTitle: string;
  timestamp: string;
  actionType: AuditActionType;
  audioNoteUrl?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}
```

No modificar `AuditEntry` para hacer `location` opcional. No usar coordenadas falsas como `0, 0`.

`AuditDraft` esta en `src/types/AuditDraft.ts` y representa una seleccion temporal antes de tener GPS:

```ts
export type AuditDraftActionType = Extract<AuditActionType, 'AUDIT_CHECK' | 'INCIDENCE'>;

export interface AuditDraft {
  productId: string;
  productTitle: string;
  actionType: AuditDraftActionType;
  audioNoteUrl?: string;
}
```

`audioNoteUrl` se agrego en FASE 7. Sigue siendo opcional: una auditoria se puede preparar y guardar sin nota de voz.

## Fases Implementadas

### FASE 1 - Base De La App

Se creo la base Expo + TypeScript + Expo Router en `src/app`, con navegacion por tabs, tema Light/Dark, componentes reutilizables y estructura base:

- `components`
- `context`
- `data`
- `hooks`
- `theme`
- `types`
- `utils`

Componentes base creados:

- `AppScreen`
- `SectionHeader`
- `StatCard`
- `EmptyState`
- `SearchBar`

### FASE 2 - Catalogo Y Busqueda

Se implemento el catalogo local en `src/data/products.ts` con 18 productos tipados como `Product[]`.

La pantalla Inventario usa:

- `FlatList`
- busqueda en tiempo real por `title`, `category` y `barcode`
- estadisticas calculadas
- `ProductCard`
- `SearchBar` controlado
- `EmptyState` cuando no hay coincidencias

La utilidad `formatCurrency` muestra precios como `$849.99`.

### FASE 3 - Detalle De Producto

Se agrego la ruta `src/app/product/[id].tsx`.

El detalle:

- normaliza `id` desde `useLocalSearchParams`
- resuelve el producto desde `products.ts`
- muestra imagen, categoria, inventario, precio y barcode
- maneja producto inexistente sin crash
- reutiliza `ProductImage` para fallback visual

Inventario navega a detalle con ruta tipada por objeto:

```ts
router.push({
  pathname: '/product/[id]',
  params: { id: product.id },
});
```

### FASE 4 - Scanner Con Camara

Se instalo y configuro `expo-camera`.

`app.json` incluye el plugin:

```json
[
  "expo-camera",
  {
    "cameraPermission": "Permite que inventar.io use la camara para escanear codigos de productos.",
    "barcodeScannerEnabled": true,
    "recordAudioAndroid": false
  }
]
```

`CameraScanner` usa:

- `CameraView`
- `facing="back"`
- `active={enabled}`
- `onBarcodeScanned`
- `barcodeScannerSettings`
- `onMountError`

La pantalla Scanner:

- solicita permisos con `useCameraPermissions`
- maneja permiso pendiente, concedido y denegado
- normaliza el codigo con `trim()`
- bloquea lecturas repetidas
- busca el producto por `barcode` en `products.ts`
- navega a `/product/[id]` si existe
- muestra estado de producto no registrado si no existe
- usa `useFocusEffect` para reactivar el scanner al volver

### FASE 5 - Flujo De Auditoria Y Context API

Se agrego `AuditContext` en memoria:

```ts
interface AuditContextValue {
  auditEntries: AuditEntry[];
  addAuditEntry: (entry: AuditEntry) => void;
}
```

`AuditProvider` vive en `src/context/AuditContext.tsx` y envuelve la app desde `src/app/_layout.tsx`.

`useAudit` vive en `src/hooks/useAudit.ts` y lanza:

```ts
throw new Error('useAudit must be used within AuditProvider');
```

Se creo la ruta `src/app/audit/[productId].tsx`.

Flujo actual:

```text
Inventario o Scanner
  -> Detalle de producto
  -> Realizar auditoria
  -> /audit/[productId]
  -> seleccionar AUDIT_CHECK o INCIDENCE
  -> Continuar
  -> AuditDraft local
  -> Auditoria preparada
  -> Ubicacion pendiente para FASE 6
```

Importante: FASE 5 no llama `addAuditEntry()` desde el formulario. Solo prepara el draft porque el `AuditEntry` final necesita GPS real.

La Bitacora ya consume `useAudit()`. Si `auditEntries.length === 0`, mantiene el EmptyState. Si en el futuro hay entradas, puede mostrar el conteo temporal de movimientos.

### FASE 6 - Ubicacion GPS Y Registro Final

Se instalo `expo-location` (`~57.0.17`) con `npx expo install expo-location` y se agrego el plugin en `app.json` solicitando unicamente permiso foreground:

```json
[
  "expo-location",
  {
    "locationWhenInUsePermission": "Permite que inventar.io use tu ubicacion para registrar donde se realizo cada auditoria."
  }
]
```

No se habilito `isIosBackgroundLocationEnabled` ni `isAndroidBackgroundLocationEnabled`. No hay background location, geofencing ni tracking permanente.

Se creo `src/hooks/useCurrentLocation.ts`, independiente de `AuditContext` (el Context sigue sin importar `expo-location`):

```ts
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationErrorKind = 'permission-denied' | 'unavailable';

export class LocationRequestError extends Error {
  readonly kind: LocationErrorKind;
  readonly canAskAgain: boolean;
}

export function useCurrentLocation(): {
  getCurrentLocation: () => Promise<Coordinates>;
};
```

`getCurrentLocation()`:

- Llama `Location.requestForegroundPermissionsAsync()`. Si el `status` no es `granted`, lanza `LocationRequestError('permission-denied', ...)` con `canAskAgain` tomado de la respuesta del sistema.
- Si el permiso fue concedido, llama `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })`. Si falla, lanza `LocationRequestError('unavailable', ...)`.
- Devuelve `{ latitude, longitude }` reales desde `location.coords`. Nunca devuelve `0, 0` como fallback.
- No usa `getLastKnownPositionAsync()`.

Se creo `src/utils/actionLabels.ts` (`getActionTypeLabel(actionType)`) y `src/utils/formatDateTime.ts` (`formatDateTime(isoTimestamp)` con `Intl.DateTimeFormat`) para no mostrar valores crudos de `actionType` ni de `timestamp` en la UI.

Se creo `src/components/AuditLogItem.tsx`: muestra `productTitle`, label de `actionType`, `formatDateTime(entry.timestamp)` y coordenadas con `toFixed(5)` solo para presentacion (el valor guardado no cambia).

`src/app/audit/[productId].tsx` ahora maneja un estado tipado para el registro:

```ts
type RegistrationState =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'saving' }
  | { kind: 'error'; error: LocationRequestError }
  | { kind: 'success'; entry: AuditEntry };
```

El boton "Registrar ubicacion" (deshabilitado en FASE 5) fue reemplazado por **"Registrar auditoria"**. Flujo del boton:

1. Guard doble: `registrationState.kind` y un `useRef` booleano evitan crear mas de un `AuditEntry` con multiples taps.
2. `getCurrentLocation()` del hook. Si falla, se muestra un panel de error (mensaje distinto para permiso denegado vs GPS no disponible) con boton "Intentar nuevamente"/"Reintentar"; si el permiso ya no se puede volver a pedir (`canAskAgain === false`), aparece tambien "Abrir configuracion" que llama `Linking.openSettings()` solo tras el tap explicito del usuario. En ningun caso de error se llama `addAuditEntry`.
3. Si hay coordenadas, se genera `timestamp` con `createTimestamp()` (justo antes de guardar) e `id` con `generateId()` (nunca se usa `product.id`), se construye el `AuditEntry` completo (sin `audioNoteUrl`) y se llama `addAuditEntry(entry)`.
4. La pantalla cambia a un estado de exito que reemplaza el formulario (no se puede volver a presionar Guardar desde la misma instancia): muestra producto, resultado, hora y "Ubicacion: Registrada correctamente", con boton primario "Ver bitacora" (`router.push('/audit-log')`) y secundario "Volver al inventario" (`router.replace('/')`).

`src/app/(tabs)/audit-log.tsx` ahora consume `useAudit()` y renderiza un `AuditLogItem` por cada `auditEntries`, mostrando los mas recientes primero mediante una copia invertida (`[...auditEntries].reverse()`) sin mutar el arreglo original del Context. El `EmptyState` se mantiene cuando no hay registros.

No se implemento en esta fase: `expo-audio`, `react-native-maps`/marcadores en el mapa, ni `AsyncStorage` (persistencia). `AuditEntry.audioNoteUrl` sigue sin usarse.

### FASE 7 - Notas De Voz Con Expo-Audio

Se instalo `expo-audio` (`~57.0.5`, NO `expo-av`) con `npx expo install expo-audio`. El comando agrego automaticamente el plugin `"expo-audio"` (sin configuracion) en `app.json`; se completo manualmente con:

```json
[
  "expo-audio",
  {
    "microphonePermission": "Esta aplicacion utiliza el microfono para adjuntar notas de voz a las auditorias de inventario.",
    "enableBackgroundRecording": false,
    "enableBackgroundPlayback": false
  }
]
```

`enableBackgroundPlayback` es `true` por defecto en el plugin; se forzo a `false` junto con `enableBackgroundRecording: false` porque esta fase no requiere audio en segundo plano (consistente con la filosofia de FASE 6 de no pedir permisos de mas).

Se creo `src/utils/formatDuration.ts` (`formatDuration(durationMillis) -> "MM:SS"`).

Se creo `src/components/AudioPlayer.tsx`, reutilizable y aislado: recibe solo `{ uri: string; label?: string }`, no conoce `AuditEntry`, `Product`, GPS ni el Context. Usa `useAudioPlayer(uri)` + `useAudioPlayerStatus(player)` de `expo-audio`. Un unico `Pressable` alterna `play()`/`pause()`; si `status.didJustFinish` es `true`, hace `seekTo(0)` antes de reproducir de nuevo. Al desmontarse, `useAudioPlayer` libera el recurso automaticamente (comportamiento documentado de la API).

Se creo `src/components/AudioRecorder.tsx`, tambien reutilizable e independiente del dominio (no crea `AuditEntry`, no conoce `products.ts`, no conoce `AuditContext`, no navega, no maneja GPS). Props: `{ value?: string; onChange: (uri?: string) => void }` (componente controlado). Usa:

- `useAudioRecorder(RecordingPresets.HIGH_QUALITY)` para la instancia del grabador.
- `useAudioRecorderState(audioRecorder, 500)` para leer `isRecording` y `durationMillis` en vivo.
- `requestRecordingPermissionsAsync()` para pedir el permiso de microfono **solo** cuando el usuario presiona "Grabar nota" (nunca al abrir la app, Inventario o Scanner).
- `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })` antes de `prepareToRecordAsync()` + `record()`.

Estado local tipado (sin maquina de estados formal):

```ts
type RecorderStatus =
  | { kind: 'idle' }
  | { kind: 'requesting-permission' }
  | { kind: 'recording' }
  | { kind: 'error'; error: AudioRecordingError };
```

El estado "grabacion lista" (equivalente a `RECORDED` del documento academico) no se modela como un miembro adicional del union: se deriva de la prop `value` (si existe URI, se muestra la tarjeta de preview). El estado `PLAYING` tampoco es un miembro propio: se delega por completo a `AudioPlayer`, reutilizado dentro de la tarjeta de preview de `AudioRecorder`, para no duplicar logica de reproduccion (tal como sugiere el documento de la fase). Esta es una decision de diseno documentada explicitamente.

Manejo de errores/permiso (igual patron que `LocationRequestError` de FASE 6): si el permiso es denegado, se muestra "No se pudo acceder al microfono" + "Puedes continuar con la auditoria sin agregar una nota de voz." + boton "Intentar nuevamente"; si `canAskAgain === false`, aparece tambien "Abrir configuracion" (`Linking.openSettings()`, solo tras tap explicito). La nota de voz **nunca** bloquea el guardado de la auditoria.

Al desmontarse mientras se esta grabando (por ejemplo, el usuario navega hacia atras), un efecto de limpieza llama `audioRecorder.stop()` en un intento silencioso (best-effort) para no dejar el microfono activo.

`src/types/AuditDraft.ts` ahora incluye `audioNoteUrl?: string`. `src/app/audit/[productId].tsx` agrega:

- Estado local `audioNoteUrl` en la pantalla de seleccion de resultado, con `<AudioRecorder value={audioNoteUrl} onChange={setAudioNoteUrl} />` ubicado entre las opciones de resultado y el boton "Continuar" (antes de crear el draft, tal como exige la fase).
- `handlePrepareDraft` incluye `audioNoteUrl` en el `AuditDraft`.
- El resumen de "Auditoria preparada" y la pantalla de exito muestran una fila "Nota de voz" con `<AudioPlayer uri={...} />` si existe, o "Sin nota de voz" si no.
- `handleRegisterAudit` sigue ejecutando `getCurrentLocation()` exactamente igual que en FASE 6 (no se movio, no se toco el orden GPS -> `generateId()` -> `createTimestamp()`). Al construir el `AuditEntry` final, `audioNoteUrl` se agrega solo si existe (spread condicional), nunca como cadena vacia:

```ts
const entry: AuditEntry = {
  id: generateId(),
  productId: preparedDraft.productId,
  productTitle: preparedDraft.productTitle,
  timestamp: createTimestamp(),
  actionType: preparedDraft.actionType,
  ...(preparedDraft.audioNoteUrl ? { audioNoteUrl: preparedDraft.audioNoteUrl } : {}),
  location: coordinates,
};
```

`src/components/AuditLogItem.tsx` ahora renderiza `<AudioPlayer uri={entry.audioNoteUrl} label="Reproducir nota" />` cuando `entry.audioNoteUrl` existe; si no existe, no se muestra ningun boton (ni deshabilitado).

No se implemento en esta fase: persistencia (`AsyncStorage`/`FileSystem` persistente), backend/uploads, ni mapa real. Las URIs de audio (`file://...` generadas por `expo-audio`) viven solo en memoria durante la sesion actual, igual que `auditEntries`.

### FASE 8 - Mapa De Registros Georreferenciados

Se instalo `react-native-maps` (`1.27.2`) con `npx expo install react-native-maps`. El comando no agrego ningun plugin a `app.json` (no hace falta: no se usa `provider="google"` ni API keys de Google Maps, siguiendo la recomendacion de no forzar requisitos adicionales innecesarios para un proyecto academico que se prueba en Expo Go).

Se creo `src/utils/isValidCoordinate.ts`:

```ts
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
```

Se creo `src/components/LocationMap.tsx`, un componente puramente de presentacion geografica: recibe `{ entries: AuditEntry[] }` por props y **no** importa `AuditContext`, no llama `expo-location`, no conoce `expo-audio` ni `products.ts`. Responsabilidades:

- Filtra las entradas con `isValidCoordinate()` antes de renderizarlas (si alguna fuera invalida, se omite ese `Marker` y se registra un `console.warn` solo en `__DEV__`; nunca se modifica `AuditContext`).
- Calcula la region inicial (`initialRegion`) segun la cantidad de coordenadas validas: si hay 1 o mas, centra en la primera con `latitudeDelta`/`longitudeDelta` de `0.01`; si no hay ninguna (caso de datos corruptos, no el caso "0 registros" que ya maneja `map.tsx` con el Empty State), usa una region neutral de respaldo.
- Con 2 o mas coordenadas, ajusta el viewport con `mapRef.current.fitToCoordinates(coordinates, { edgePadding, animated: true })` dentro de un `useEffect` que depende de `isMapReady` (activado por `onMapReady`) y de `coordinates`. Esto cubre tanto la carga inicial como la llegada de nuevos registros mientras la pantalla ya esta montada (`AuditContext` dispara el re-render, `coordinates` cambia de referencia, el efecto vuelve a ajustar el mapa).
- Crea un `Marker` por `AuditEntry` usando `entry.id` como `key` (nunca el indice del arreglo) y `entry.location.latitude`/`longitude` reales (nunca modificados). El color del pin distingue `INCIDENCE` (rojo/`danger`) de `AUDIT_CHECK` (verde/`success`) y `STOCK_RECEIPT` (indigo/`primary`) para no depender unicamente del texto, pero el `Callout` siempre muestra el texto del tipo con `getActionTypeLabel()` (reutilizado de FASE 6, sin duplicar formatters).
- El `Callout` muestra: `productTitle`, tipo legible, `formatDateTime(entry.timestamp)` (reutilizado de FASE 6) y las coordenadas con `toFixed(5)` solo para presentacion.
- `mapRef` esta tipado como `useRef<MapView>(null)` (sin `any`).
- No se implemento clustering ni deduplicacion por coordenadas o por producto: cada `AuditEntry` sigue siendo un marcador independiente, incluso si coincide con otro en coordenadas o `productId`.

Decision tecnica documentada: el `Callout` nativo se renderiza con fondo claro/blanco en ambas plataformas independientemente del tema de la app (limitacion del proveedor nativo del mapa). Por eso el texto dentro del `Callout` usa `lightColors` fijos de `src/theme/colors.ts` en vez de `useAppTheme()`, para garantizar buen contraste en Light y Dark Mode. El resto de la interfaz (encabezado, contador, leyenda, Empty State) si usa los tokens dinamicos del tema.

Se reescribio `src/app/(tabs)/map.tsx`:

- Consume `const { auditEntries } = useAudit();` como unica fuente de datos (no crea `mockMarkers`, no usa coordenadas hardcodeadas).
- Si `auditEntries.length === 0`, muestra `EmptyState` con el titulo "No hay ubicaciones registradas" (nunca renderiza `MapView` vacio).
- Si hay registros, muestra un encabezado con contador (`"1 registro"` / `"N registros"`, singular/plural correcto y calculado desde `auditEntries.length`, nunca hardcodeado) y una leyenda discreta (`Verificado` / `Incidencia`), y renderiza `<LocationMap entries={auditEntries} />` dentro de un contenedor con `flex: 1`.
- Usa `<AppScreen scroll={false}>` en lugar del `scroll` por defecto: un `MapView` interactivo no debe vivir dentro de un `ScrollView` porque ambos compiten por los gestos de arrastre/zoom. `AppScreen` ya soportaba `scroll={false}` desde FASE 1, por lo que no fue necesario modificar ese componente.
- No vuelve a solicitar GPS ni permisos de ubicacion: no se llama `getCurrentPositionAsync()` ni `useCurrentLocation()` desde esta pantalla. Las coordenadas usadas son siempre las que ya estan guardadas en cada `AuditEntry`.

No se implemento en esta fase: `AsyncStorage`, persistencia, SQLite, backend, autenticacion, edicion/eliminacion de auditorias, rutas entre marcadores, navegacion GPS, geofencing, tracking en tiempo real ni clustering de marcadores. `AuditEntry` no fue modificado (sigue igual que en FASE 7).

**Limitacion conocida de Expo Web**: `react-native-maps` no tiene una implementacion funcional para Web; su propio codigo fuente (`MapView.web.ts`) reexporta `UnimplementedView` de `react-native-web`. Esto significa que en `npx expo start --web` la pestaña "Mapa" bundlea y renderiza sin errores (verificado con `npx expo export --platform web --clear`), pero no mostrara un mapa interactivo real en el navegador, solo un placeholder vacio de `react-native-web`. Esto es una limitacion de la libreria, no de esta implementacion; siguiendo el documento de la fase, no se construyo una solucion alternativa completa solo para Web. La prioridad (Android e iOS con `MapView` real, luego Web "solo si funciona naturalmente") se respeto tal como se solicito.

### FASE 9 - Persistencia (AsyncStorage), CatalogContext Y Edicion De Barcode

Fase final de consolidacion. Se instalo `@react-native-async-storage/async-storage` (`2.2.0`) con `npx expo install`. No requiere plugin en `app.json` ni permisos nuevos.

**`src/constants/storageKeys.ts`** centraliza las claves (nunca se repiten strings sueltos):

```ts
export const STORAGE_KEYS = {
  AUDIT_ENTRIES: 'inventory.auditEntries.v1',
  BARCODE_OVERRIDES: 'inventory.barcodeOverrides.v1',
} as const;
```

**`src/data/products.ts`** ahora exporta `initialProducts` (antes `products`). Es el catalogo base/semilla: ya **no** se importa directamente en ninguna pantalla (`index.tsx`, `scanner.tsx`, `product/[id].tsx`, `audit/[productId].tsx`); solo lo importa `CatalogContext.tsx`. `initialProducts` nunca se muta.

**`src/context/CatalogContext.tsx`** (nuevo) + **`src/hooks/useCatalog.ts`** (nuevo):

```ts
interface CatalogContextValue {
  products: Product[];
  isHydrated: boolean;
  isBarcodeModified: (productId: string) => boolean;
  updateProductBarcode: (productId: string, barcode: string) => Promise<UpdateBarcodeResult>;
  resetProductBarcode: (productId: string) => Promise<UpdateBarcodeResult>;
}

type UpdateBarcodeResult =
  | { success: true }
  | { success: false; reason: 'EMPTY' | 'DUPLICATE' | 'NOT_FOUND'; message: string };
```

- **Estrategia de persistencia**: solo se guardan los overrides de barcode como `{ [productId]: barcode }` en `STORAGE_KEYS.BARCODE_OVERRIDES` (no se duplica el catalogo completo). `products` es un `useMemo` derivado de `initialProducts.map(p => overrides[p.id] ? {...p, barcode: overrides[p.id]} : p)`, por lo que sigue siendo un arreglo `Product[]` normal para el resto de la app.
- **`isBarcodeModified(productId)`**: devuelve si ese producto tiene un override activo (evita que las pantallas necesiten importar `initialProducts` para comparar).
- **`updateProductBarcode(productId, raw)`**: normaliza con `raw.trim()` (nunca `Number()`/`parseInt()`, para conservar ceros iniciales y formatos alfanumericos Code128/Code39); rechaza vacio (`reason: 'EMPTY'`); busca duplicados en el catalogo **actual** (`products.find(p => p.id !== productId && p.barcode === barcode)`) y rechaza con `reason: 'DUPLICATE'` mostrando el nombre del producto en conflicto; si pasa las validaciones, actualiza el override de forma inmutable (`{ ...current, [productId]: barcode }`).
- **`resetProductBarcode(productId)`**: busca el barcode original en `initialProducts`; antes de restaurar valida que ese codigo original no este actualmente en uso por otro producto modificado (si hay conflicto, `reason: 'DUPLICATE'` con mensaje claro); si esta libre, elimina la key del objeto de overrides de forma inmutable.
- **Hidratacion**: un `useEffect` (una sola vez) lee `STORAGE_KEYS.BARCODE_OVERRIDES`, valida la forma con `isBarcodeOverrides()` (`src/utils/isValidBarcodeOverrides.ts`) y solo entonces marca `isHydrated = true`. Un segundo `useEffect`, condicionado a `isHydrated`, persiste `barcodeOverrides` en cada cambio. Este orden (hidratar -> marcar `isHydrated` -> recien ahi permitir persistir) evita sobreescribir el storage con `{}` antes de leerlo.
- **Datos corruptos**: si `JSON.parse` falla o la forma no es valida, se ignora el contenido, se limpia la key con `AsyncStorage.removeItem` y se continua con el catalogo inicial sin overrides (nunca se deja la app inutilizable).

`src/app/_layout.tsx` ahora envuelve la app con `CatalogProvider` (por fuera de `AuditProvider`) y agrega `AppHydrationGate`, que no renderiza el `Stack` hasta que `useCatalog().isHydrated && useAudit().isHydrated`; mientras tanto muestra "Cargando inventario..." con `ActivityIndicator`, usando los tokens de tema.

**`AuditContext.tsx`** recibio el mismo patron de persistencia/hidratacion que `CatalogContext`:

- Nueva key `STORAGE_KEYS.AUDIT_ENTRIES`.
- Nuevo campo `isHydrated: boolean` en el contexto (aditivo, no rompe consumidores existentes de `useAudit()`).
- Validacion de datos leidos con `isAuditEntryArray()` (`src/utils/isValidAuditEntry.ts`), que verifica minimamente la forma de cada `AuditEntry` (`id`, `productId`, `productTitle`, `timestamp`, `actionType` dentro del union valido, `location.latitude/longitude` numericos, `audioNoteUrl` opcional pero si existe debe ser string) antes de restaurarlo. Si algo no calza, se descarta esa entrada silenciosamente (con `console.warn` en `__DEV__`) en vez de crashear.
- Mismo cuidado de "hidratar antes de persistir" que en `CatalogContext` para no sobreescribir el storage al iniciar.
- Como Bitacora y Mapa ya consumian `useAudit()` (FASE 6/8), ambos reciben las auditorias restauradas automaticamente sin cambios adicionales: `AsyncStorage -> AuditContext -> auditEntries -> AuditLogItem` / `LocationMap`.

**Migracion de pantallas a `useCatalog()`** (ninguna vuelve a importar `initialProducts`/`products.ts` directamente):

- `src/app/(tabs)/index.tsx`: `const { products } = useCatalog();`. Los `useMemo` de estadisticas y de filtrado ahora dependen de `products` (antes de esta fase `products` era un import estatico y no hacia falta declararlo como dependencia; ahora si, porque puede cambiar cuando se edita un barcode).
- `src/app/(tabs)/scanner.tsx`: `const { products } = useCatalog();`; `handleBarcodeScanned` agrega `products` a sus dependencias de `useCallback` para no comparar contra un catalogo obsoleto.
- `src/app/product/[id].tsx`: resuelve el producto con `products.find(...)` desde `useCatalog()`.
- `src/app/audit/[productId].tsx`: mismo cambio; el flujo de GPS/audio/timestamp de FASES 6-7 no se toco.

**Edicion de codigo de barras** (`src/app/product/[id].tsx` + `src/components/ProductDetail.tsx`):

- `ProductDetail` gano las props `isBarcodeModified`, `onEditBarcode`, `onRestoreBarcode?`. Debajo del codigo de barras se agrego un boton "Editar codigo de barras" y, solo si el barcode fue modificado, una etiqueta "Modificado" junto al valor y un boton "Restaurar codigo original". `Product` **no** se modifico (no se agrego `editableBarcode` ni ningun campo nuevo); el valor mostrado sigue siendo `product.barcode`, ya resuelto por `CatalogContext`.
- **`src/components/EditBarcodeModal.tsx`** (nuevo): modal con `TextInput` controlado, inicializado con el barcode actual cada vez que se abre. Usa teclado por defecto (no `number-pad`) para no bloquear formatos alfanumericos (Code128/Code39). Al guardar llama `onSubmit(value)` (que la pantalla conecta a `updateProductBarcode`); si el resultado es `success: false`, muestra el `message` devuelto por el contexto (ej. `"Este codigo ya esta asignado a otro producto: Mouse Logitech."`); si es `success: true`, cierra el modal.
- **`src/components/ConfirmModal.tsx`** (nuevo, generico y reutilizable): dialogo de confirmacion usado para "Restaurar codigo original" (`"Se restaurara el codigo de barras original de {producto}."` + botones Cancelar/Restaurar). Si `resetProductBarcode` devuelve conflicto, el mensaje de error se muestra dentro del mismo modal sin cerrarlo.
- **Decision de arquitectura de UI**: ambos modales se construyeron con el `Modal` nativo de `react-native` (no con componentes de Gluestack UI), porque el proyecto solo tiene instalados `@gluestack-ui/core` y `@gluestack-ui/utils` (el proveedor de tema), no la libreria completa de componentes (`Modal`/`Actionsheet` de Gluestack no estan disponibles). Se sigue el mismo patron ya usado en toda la app: paneles/tarjetas hechos a mano con los tokens de `useAppTheme()`. Adicionalmente, `Alert.alert()` de React Native es un no-op en Expo Web (`react-native-web` no implementa ninguna UI para el), por lo que un dialogo de confirmacion propio era necesario para que "Restaurar codigo original" funcione tambien en Web.
- El Scanner reconoce el nuevo codigo de inmediato porque lee `products` directamente desde `CatalogContext` en cada render/callback (no hay cache local ni necesidad de refrescar, reiniciar la app o tocar `products.ts`).

**Persistencia de notas de voz (limitacion investigada, seccion 39 del plan)**: por defecto `expo-audio` guarda las grabaciones en el directorio de **cache** de la app (`RecordingPresets.HIGH_QUALITY` no especifica `directory`), que el sistema operativo puede borrar bajo presion de almacenamiento; guardar solo el string de la URI en `AsyncStorage` no garantiza por si solo que el archivo siga existiendo. Se investigo la documentacion oficial de `expo-audio` (SDK 57) y se encontro que la propia libreria soporta una opcion nativa `directory: 'document'` para guardar en el directorio de documentos (persistente, no sujeto a limpiezas automaticas del sistema). Se aplico este cambio en `src/components/AudioRecorder.tsx`:

```ts
const audioRecorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
```

Esta opcion es soportada nativamente por Android e iOS; en Web no aplica y se ignora sin error (no requiere `expo-file-system` ni ninguna dependencia nueva, no modifica el comportamiento de grabacion/reproduccion ya implementado en FASE 7). Limitacion residual que se documenta honestamente: si el usuario desinstala la app o borra manualmente los datos de la app desde el sistema operativo, el archivo de audio (como cualquier dato local) se perdera junto con el resto del almacenamiento local; esto es inherente a cualquier solucion basada unicamente en almacenamiento local del dispositivo, y esta fuera del alcance de esta fase (no se agrego backend/almacenamiento remoto).

**Limitacion observada en la exportacion estatica de Expo Web**: con `npx expo export --platform web --clear`, las paginas estaticas pre-renderizadas ahora muestran el HTML de la pantalla "Cargando inventario..." (verificado inspeccionando `dist/index.html`) en lugar del contenido final de cada ruta. Esto ocurre porque el renderizado estatico (`output: "static"`) ejecuta un pase de render en Node antes de servir la pagina, momento en el que `isHydrated` de `CatalogContext`/`AuditContext` aun no se resolvio; es el comportamiento esperado de cualquier gate de hidratacion asincrona combinado con SSG, no un error. En un navegador real (`expo start --web` o el HTML servido con JS habilitado), el bundle se ejecuta, los `useEffect` de hidratacion corren de inmediato contra el `localStorage` del navegador, y la pantalla real reemplaza al loader casi instantaneamente. El export sigue completando sin errores (`exit code 0`) y no afecta Android/iOS (no usan renderizado estatico).

No se implemento en esta fase: backend, Laravel, API remota, autenticacion, base de datos SQL, sincronizacion cloud, login, multiusuario, ni una funcion visible de "Restablecer datos de prueba" (opcional segun el documento de la fase; se omitio para mantener el alcance controlado, dado que ya es una fase muy amplia). `Product` y `AuditEntry` no fueron modificados.

## Flujo De Datos

Fuente de verdad en runtime (desde FASE 9):

```text
src/data/products.ts (initialProducts, catalogo base/semilla)
  -> CatalogContext (aplica overrides de barcode persistidos)
  -> useCatalog().products
  -> Inventario / Scanner / ProductDetail / Audit Screen
```

`src/data/products.ts` ya **no** se importa directamente desde ninguna pantalla; solo `CatalogContext.tsx` lo conoce.

Resolucion de producto (todas via `useCatalog()`):

- Inventario usa `products` para listar y filtrar.
- Scanner busca por `barcode`.
- Detalle busca por `id`.
- Auditoria busca por `productId`.

Estado global:

```text
CatalogProvider
  -> products: Product[] (initialProducts + barcodeOverrides)
  -> updateProductBarcode(productId, barcode)
  -> resetProductBarcode(productId)
  -> isBarcodeModified(productId)
  -> isHydrated

AuditProvider
  -> auditEntries: AuditEntry[]
  -> addAuditEntry(entry)
  -> isHydrated
```

Ambos providers persisten en `AsyncStorage` bajo las claves de `src/constants/storageKeys.ts` y se restauran automaticamente al iniciar la app, antes de que `AppHydrationGate` permita mostrar cualquier pantalla.

Estado local de auditoria:

```text
audit/[productId]
  -> selectedAction
  -> preparedDraft
```

## Reglas Importantes Para Continuar

- No reconstruir el proyecto.
- No cambiar `Product` salvo que una fase futura lo pida de forma explicita.
- No cambiar `AuditEntry.location`; debe seguir siendo obligatorio.
- No guardar `AuditEntry` sin GPS real (ya implementado en FASE 6 via `useCurrentLocation`).
- No usar coordenadas dummy (verificado: no hay fallback `0, 0` en el codigo).
- No agregar SQLite, backend, API remota, autenticacion, login, multiusuario ni sincronizacion cloud (fuera de alcance academico, explicitamente excluido en FASE 9).
- No agregar background location, geofencing ni tracking permanente (`expo-location` solo pide permiso foreground).
- No usar `expo-av`; el audio usa exclusivamente `expo-audio` (ya implementado en FASE 7).
- La nota de voz es siempre opcional: una auditoria debe poder guardarse sin `audioNoteUrl`.
- No agregar audio en segundo plano (`enableBackgroundRecording`/`enableBackgroundPlayback` en `false`).
- El mapa (`src/app/(tabs)/map.tsx` + `src/components/LocationMap.tsx`, ya implementado en FASE 8) usa exclusivamente las coordenadas ya guardadas en `auditEntries`; nunca debe volver a llamar `getCurrentPositionAsync()` ni pedir permisos de GPS solo para mostrarse.
- No agregar clustering de marcadores ni deduplicar `AuditEntry` por coordenadas/`productId` en el mapa.
- No importar `src/data/products.ts` directamente desde pantallas (FASE 9): la unica fuente de verdad en runtime del catalogo es `useCatalog()` / `CatalogContext`. Solo `CatalogContext.tsx` puede importar `initialProducts`.
- No agregar campos nuevos a `Product` (por ejemplo `editableBarcode`); el barcode editado sigue viviendo en `product.barcode`, resuelto por `CatalogContext` a partir de `initialProducts` + overrides.
- El barcode se maneja siempre como `string`; nunca convertir con `Number()`/`parseInt()`/`parseFloat()` (se perderian ceros iniciales).
- No dejar que `AuditProvider`/`CatalogProvider` persistan en `AsyncStorage` antes de terminar de hidratar (`isHydrated`); cualquier cambio a estos providers debe respetar el orden "hidratar -> marcar isHydrated -> recien ahi permitir persistencia".
- Mantener las claves de `AsyncStorage` centralizadas en `src/constants/storageKeys.ts`; no repetir strings de claves sueltos en el codigo.
- Mantener textos de UI en espanol sin acentos dentro del codigo para consistencia.
- Antes de editar APIs de Expo, revisar docs versionadas de Expo SDK 57.

## Proxima Fase Sugerida

FASE 9 fue la fase final de desarrollo funcional segun el plan del proyecto. No hay una fase 10 definida; el documento de FASE 9 indica explicitamente detenerse al terminarla. Si en el futuro se retoma el desarrollo, candidatos naturales fuera del alcance academico actual serian: backend/API real, autenticacion, sincronizacion multi-dispositivo, o una funcion visible de "Restablecer datos de prueba" (mencionada como opcional en FASE 9 y no implementada, para mantener el alcance controlado).

## Validaciones Utiles

Comandos recomendados despues de cada fase:

```bash
npm run typecheck
npx expo export --platform web --clear
npx expo start --localhost --port 8081
```

Si se agregan rutas nuevas y TypeScript no las reconoce, refrescar typed routes:

```bash
npx expo customize tsconfig.json
```

Luego volver a ejecutar:

```bash
npm run typecheck
```

## Ultima Validacion Conocida

Despues de FASE 9:

- `npx expo install @react-native-async-storage/async-storage`: correcto (`2.2.0`). No se agrego plugin ni permisos nuevos a `app.json`.
- `npm run typecheck`: correcto, sin errores (sin `any`, sin `@ts-ignore`, sin casts para esconder errores).
- `npx expo export --platform web --clear`: correcto (`exit code 0`). Limitacion observada y documentada arriba: el HTML estatico pre-renderizado muestra el loader "Cargando inventario..." en vez del contenido final de cada ruta (esperado por el gate de hidratacion asincrona + renderizado estatico; se resuelve normalmente en el navegador real al ejecutar el JS).
- `npx expo export --platform android --clear`: correcto, bundle Android generado sin errores de resolucion de modulos con `CatalogContext`/`AsyncStorage`/modales nuevos incluidos.
- No hay script de lint configurado (igual que en fases anteriores); se revisaron manualmente imports/variables sin usar en los archivos modificados.
- Se agrego: persistencia de `auditEntries` y de overrides de barcode con `AsyncStorage`; `CatalogContext`/`useCatalog`; edicion/restauracion de codigo de barras con validacion de vacio y duplicados; estados de hidratacion (`isHydrated`) en ambos providers con pantalla de carga en el Root Layout; notas de voz guardadas en directorio persistente (`directory: 'document'` de `expo-audio`). No se agrego backend, SQLite, autenticacion ni sincronizacion cloud.
- **Pruebas de edicion de barcode** (Pruebas A-J del plan de FASE 9): logica verificada por lectura de codigo y por el flujo de tipos de `UpdateBarcodeResult` (vacio -> `EMPTY`, duplicado -> `DUPLICATE` con nombre del producto en conflicto, exito -> persiste y cierra el modal); pendientes de ejecutar interactivamente en emulador/dispositivo fisico (incluye escaneo fisico real, pruebas G y J) porque este entorno de desarrollo no tiene un emulador/dispositivo conectado disponible para el agente.
- **Pruebas de persistencia** (1-4 del plan): logica de hidratacion/persistencia verificada por lectura de codigo (orden hidratar -> `isHydrated` -> persistir, validacion de forma con `isAuditEntryArray`/`isBarcodeOverrides`); pendientes de ejecutar cerrando y reabriendo la app real en emulador/dispositivo, no disponible en este entorno.
- **Prueba integral para la defensa** (seccion 64 del plan): flujo completo revisado componente por componente (Inventario -> buscar -> ficha -> editar barcode -> Scanner -> auditoria con incidencia + audio -> GPS -> Bitacora -> Mapa -> cerrar/reabrir), pero no ejecutado de punta a punta en un dispositivo real por la misma limitacion de entorno.

Despues de FASE 8:

- `npx expo install react-native-maps`: correcto (`react-native-maps@1.27.2`). No se agrego plugin a `app.json` (no requerido sin `provider="google"`/API keys).
- `npm run typecheck`: correcto, sin errores (sin `any`, sin `@ts-ignore`).
- `npx expo export --platform web --clear`: correcto, incluye `/map` y `/(tabs)/map` exportados sin errores. Limitacion conocida: `react-native-maps` no tiene implementacion funcional en Web (`MapView.web.ts` reexporta `UnimplementedView`), por lo que el bundling funciona pero no se vera un mapa interactivo real en el navegador.
- `npx expo export --platform android --clear`: correcto, el bundle Android incluye `LocationMap`/`MapView`/`Marker`/`Callout` sin errores de resolucion de modulos.
- No hay script de lint configurado.
- Se agrego el mapa de registros georreferenciados (`MapView`, `Marker` por `AuditEntry`, `Callout` con producto/tipo/fecha/coordenadas, ajuste automatico de viewport con `fitToCoordinates`, Empty State sin registros). No se agrego persistencia, backend, clustering ni se solicito GPS nuevamente.
- Pruebas manuales pendientes de ejecutar en emulador/dispositivo fisico (0/1/varios registros, tocar Marker, agregar auditoria y volver al mapa sin recargar, Light/Dark Mode, mismo producto auditado varias veces, coordenadas iguales) porque este entorno de desarrollo no tiene un emulador/dispositivo conectado disponible para el agente.

Despues de FASE 7:

- `npx expo install expo-audio`: correcto (`expo-audio@~57.0.5`).
- `npm run typecheck`: correcto, sin errores.
- `npx expo export --platform web --clear`: correcto. Incluye las rutas estaticas `/audit-log` y `/audit/[productId]` exportadas sin errores junto con los nuevos componentes de audio.
- No hay script de lint configurado.
- Se agrego grabacion/reproduccion de notas de voz opcionales con `expo-audio` (no `expo-av`). No se agrego persistencia, backend, mapa real ni coordenadas/audio falsos.
- Pruebas manuales pendientes de ejecutar en emulador/dispositivo fisico (permiso de microfono aceptado/rechazado, grabar/detener/reproducir/eliminar/regrabar, guardar auditoria con y sin audio, reproducir desde Bitacora, salir de pantalla mientras se grababa, Light/Dark Mode) porque este entorno de desarrollo no tiene un emulador/dispositivo conectado disponible para el agente.

Despues de FASE 6 (referencia historica):

- `npm install` + `npx expo install expo-location`: correcto (`expo-location@~57.0.17`).
- `npm run typecheck`: correcto, sin errores.
- `npx expo export --platform web --clear`: correcto.

## Notas Operativas

El workspace ha usado NVM en Windows. Si `npm`, `npx` o Expo fallan por shims, se ha usado previamente:

```bash
nvm reshim
```

Expo Router esta configurado para usar `src/app` y `app.json` tiene `experiments.typedRoutes: true`.
