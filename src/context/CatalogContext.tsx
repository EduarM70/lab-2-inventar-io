import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { initialProducts } from '@/data/products';
import { Product } from '@/types/Product';
import { isBarcodeOverrides } from '@/utils/isValidBarcodeOverrides';

export type UpdateBarcodeResult =
  | { success: true }
  | {
      success: false;
      reason: 'EMPTY' | 'DUPLICATE' | 'NOT_FOUND';
      message: string;
    };

interface CatalogContextValue {
  products: Product[];
  isHydrated: boolean;
  isBarcodeModified: (productId: string) => boolean;
  updateProductBarcode: (productId: string, barcode: string) => Promise<UpdateBarcodeResult>;
  resetProductBarcode: (productId: string) => Promise<UpdateBarcodeResult>;
}

export const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: PropsWithChildren) {
  // Unicamente se persisten los overrides de barcode (productId -> barcode editado), no el
  // catalogo completo: initialProducts sigue siendo la base y esto simplifica restaurar valores.
  const [barcodeOverrides, setBarcodeOverrides] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratacion: se ejecuta una sola vez al montar. Solo despues de terminar (exito o error)
  // se marca isHydrated = true, para que el efecto de persistencia de abajo no alcance a
  // sobreescribir el storage con el estado inicial vacio antes de leerlo (ver seccion 33 del plan).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.BARCODE_OVERRIDES);

        if (raw) {
          const parsed: unknown = JSON.parse(raw);

          if (isBarcodeOverrides(parsed)) {
            if (!cancelled) {
              setBarcodeOverrides(parsed);
            }
          } else if (__DEV__) {
            console.warn('CatalogContext: overrides de barcode con formato invalido, se ignoran.');
          }
        }
      } catch (error: unknown) {
        if (__DEV__) {
          console.warn('CatalogContext: no se pudieron leer los overrides de barcode.', error);
        }

        // Datos corruptos: se limpia la clave para no reintentar parsear basura en cada inicio,
        // y se continua con el catalogo inicial (nunca se deja la app inutilizable).
        await AsyncStorage.removeItem(STORAGE_KEYS.BARCODE_OVERRIDES).catch(() => undefined);
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persistencia: solo se activa despues de que la hidratacion inicial termino.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEYS.BARCODE_OVERRIDES, JSON.stringify(barcodeOverrides)).catch(
      (error: unknown) => {
        if (__DEV__) {
          console.warn('CatalogContext: no se pudo persistir el override de barcode.', error);
        }
      },
    );
  }, [barcodeOverrides, isHydrated]);

  // Fuente de verdad en runtime: initialProducts (catalogo base, nunca mutado) + overrides.
  const products = useMemo<Product[]>(
    () =>
      initialProducts.map((product) => {
        const overrideBarcode = barcodeOverrides[product.id];

        return overrideBarcode ? { ...product, barcode: overrideBarcode } : product;
      }),
    [barcodeOverrides],
  );

  const isBarcodeModified = useCallback(
    (productId: string) => productId in barcodeOverrides,
    [barcodeOverrides],
  );

  const updateProductBarcode = useCallback(
    async (productId: string, rawBarcode: string): Promise<UpdateBarcodeResult> => {
      // Nunca convertir a numero: se conservan ceros iniciales y formatos alfanumericos (Code128/39).
      const barcode = rawBarcode.trim();

      if (barcode.length === 0) {
        return {
          success: false,
          reason: 'EMPTY',
          message: 'Ingresa un codigo de barras valido.',
        };
      }

      const targetExists = initialProducts.some((product) => product.id === productId);

      if (!targetExists) {
        return {
          success: false,
          reason: 'NOT_FOUND',
          message: 'El producto no existe en el catalogo.',
        };
      }

      const duplicate = products.find(
        (product) => product.id !== productId && product.barcode === barcode,
      );

      if (duplicate) {
        return {
          success: false,
          reason: 'DUPLICATE',
          message: `Este codigo ya esta asignado a otro producto: ${duplicate.title}.`,
        };
      }

      setBarcodeOverrides((current) => ({ ...current, [productId]: barcode }));

      return { success: true };
    },
    [products],
  );

  const resetProductBarcode = useCallback(
    async (productId: string): Promise<UpdateBarcodeResult> => {
      const original = initialProducts.find((product) => product.id === productId);

      if (!original) {
        return {
          success: false,
          reason: 'NOT_FOUND',
          message: 'El producto no existe en el catalogo.',
        };
      }

      // No generar duplicados al restaurar: el codigo original podria haber sido asignado
      // mientras tanto a otro producto modificado.
      const conflict = products.find(
        (product) => product.id !== productId && product.barcode === original.barcode,
      );

      if (conflict) {
        return {
          success: false,
          reason: 'DUPLICATE',
          message: `No se puede restaurar: el codigo original ya pertenece a ${conflict.title}.`,
        };
      }

      setBarcodeOverrides((current) => {
        if (!(productId in current)) {
          return current;
        }

        const next = { ...current };
        delete next[productId];

        return next;
      });

      return { success: true };
    },
    [products],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      isHydrated,
      isBarcodeModified,
      updateProductBarcode,
      resetProductBarcode,
    }),
    [products, isHydrated, isBarcodeModified, updateProductBarcode, resetProductBarcode],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
