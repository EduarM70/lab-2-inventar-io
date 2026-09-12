# inventar.io - Documento De Continuidad

Este documento resume el estado actual de la app movil academica `inventar.io` para que otra persona o IA pueda continuar el desarrollo sin reconstruir el contexto de las fases anteriores.

## Estado General

`inventar.io` es una app de auditoria y control de inventario en bodega construida con React Native, Expo SDK 57, TypeScript estricto y Expo Router usando `src/app` como raiz de rutas.

La app ya cuenta con:

- Navegacion por tabs: Inventario, Escaner, Bitacora y Mapa.
- Rutas secundarias fuera de tabs para detalle de producto y auditoria.
- Tema centralizado con Light Mode y Dark Mode.
- Gluestack UI y UniWind configurados.
- Catalogo local de productos.
- Scanner real de codigos con `expo-camera`.
- Estado global inicial de auditorias con Context API.

## Stack Y Dependencias

Versiones principales actuales:

- `expo`: `~57.0.22`
- `expo-router`: `~57.0.21`
- `expo-camera`: `~57.0.5`
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
- `src/app/(tabs)/map.tsx`: Mapa placeholder.
- `src/app/product/[id].tsx`: Detalle de producto.
- `src/app/audit/[productId].tsx`: Flujo inicial de auditoria.
- `src/app/_layout.tsx`: Stack raiz y providers globales.

Providers globales actuales:

- `AppThemeProvider`
- `GluestackUIProvider`
- `NavigationThemeProvider`
- `SafeAreaProvider`
- `AuditProvider`

No se deben duplicar providers. Cualquier nuevo estado global debe integrarse con cuidado en `src/app/_layout.tsx`.

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
}
```

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

## Flujo De Datos

Fuente de verdad del catalogo:

```text
src/data/products.ts
```

Resolucion de producto:

- Inventario usa `products` para listar y filtrar.
- Scanner busca por `barcode`.
- Detalle busca por `id`.
- Auditoria busca por `productId`.

Estado global:

```text
AuditProvider
  -> auditEntries: AuditEntry[]
  -> addAuditEntry(entry)
```

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
- No guardar `AuditEntry` sin GPS real.
- No usar coordenadas dummy.
- No agregar `AsyncStorage`, SQLite, backend o API hasta que se pida persistencia.
- No agregar audio hasta la fase correspondiente.
- No agregar mapas reales hasta la fase correspondiente.
- Mantener textos de UI en espanol sin acentos dentro del codigo para consistencia.
- Antes de editar APIs de Expo, revisar docs versionadas de Expo SDK 57.

## Proxima Fase Sugerida

La continuacion natural es FASE 6: captura de ubicacion GPS.

Implementacion esperada:

- Instalar `expo-location` con `npx expo install expo-location`.
- Configurar permisos de ubicacion en `app.json`.
- Crear un hook o servicio para pedir permisos y obtener ubicacion.
- En `audit/[productId]`, activar `Registrar ubicacion`.
- Al obtener GPS real, crear el `AuditEntry` final con:
  - `id` desde `generateId()`
  - `timestamp` desde `createTimestamp()`
  - `productId`
  - `productTitle`
  - `actionType`
  - `location.latitude`
  - `location.longitude`
- Llamar `addAuditEntry(entry)`.
- Navegar o confirmar que la auditoria fue registrada.
- Actualizar Bitacora para mostrar entradas reales de forma basica.

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

Despues de FASE 5:

- `npm run typecheck`: correcto.
- `npx expo export --platform web --clear`: correcto.
- `npx expo start --localhost --port 8081`: Metro inicio correctamente y fue detenido despues.
- No hay script de lint configurado.
- No se agregaron GPS, audio, persistencia, backend ni coordenadas falsas.

## Notas Operativas

El workspace ha usado NVM en Windows. Si `npm`, `npx` o Expo fallan por shims, se ha usado previamente:

```bash
nvm reshim
```

Expo Router esta configurado para usar `src/app` y `app.json` tiene `experiments.typedRoutes: true`.
