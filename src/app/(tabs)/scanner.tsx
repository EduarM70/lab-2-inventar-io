import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { CameraScanner } from '@/components/CameraScanner';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCatalog } from '@/hooks/useCatalog';

type ScanStatus = 'idle' | 'found' | 'not-found' | 'camera-error';

export default function ScannerScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { products } = useCatalog();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [matchedProductTitle, setMatchedProductTitle] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannedRef = useRef(false);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetScanner = useCallback(() => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }

    scannedRef.current = false;
    setScanned(false);
    setScanStatus('idle');
    setLastScannedCode(null);
    setMatchedProductTitle(null);
    setCameraError(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Al recuperar foco se limpia el bloqueo para permitir otro escaneo despues de volver del detalle.
      resetScanner();

      return () => {
        if (navigationTimerRef.current) {
          clearTimeout(navigationTimerRef.current);
          navigationTimerRef.current = null;
        }

        scannedRef.current = true;
        setScanned(true);
      };
    }, [resetScanner]),
  );

  const handleRequestPermission = async () => {
    if (permission?.canAskAgain === false) {
      await Linking.openSettings();
      return;
    }

    await requestPermission();
  };

  const handleBarcodeScanned = useCallback(
    (code: string) => {
      // La camara puede emitir muchas lecturas por segundo; este bloqueo evita navegaciones duplicadas.
      if (scannedRef.current) {
        return;
      }

      scannedRef.current = true;
      setScanned(true);
      setLastScannedCode(code);

      const product = products.find((item) => item.barcode === code);

      if (!product) {
        setScanStatus('not-found');
        return;
      }

      setScanStatus('found');
      setMatchedProductTitle(product.title);

      navigationTimerRef.current = setTimeout(() => {
        router.push({
          pathname: '/product/[id]',
          params: { id: product.id },
        });
      }, 500);
    },
    [products, router],
  );

  const handleCameraError = useCallback((message: string) => {
    scannedRef.current = true;
    setScanned(true);
    setScanStatus('camera-error');
    setCameraError(message);
  }, []);

  if (!permission) {
    return (
      <AppScreen>
        <SectionHeader title="Escaner" description="Escanea el codigo de barras de un producto" />
        <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Preparando camara...</Text>
          <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>
            Estamos comprobando el permiso de camara del dispositivo.
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!permission.granted) {
    const actionLabel = permission.canAskAgain ? 'Permitir acceso' : 'Abrir configuracion';

    return (
      <AppScreen>
        <SectionHeader title="Escaner" description="Escanea el codigo de barras de un producto" />
        <EmptyState
          title="Se necesita acceso a la camara"
          description="El escaner utiliza la camara para leer los codigos de los productos."
          icon={<Ionicons name="camera-outline" size={30} color={colors.textSecondary} />}
        />
        <PrimaryButton label={actionLabel} icon="camera-outline" onPress={handleRequestPermission} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionHeader
        title="Escaner"
        description="Escanea el codigo de barras de un producto"
      />

      <CameraScanner
        enabled={!scanned && scanStatus === 'idle'}
        onBarcodeScanned={handleBarcodeScanned}
        onCameraError={handleCameraError}
      />

      <View style={[styles.helpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="barcode-outline" size={22} color={colors.primary} />
        <View style={styles.helpText}>
          <Text style={[styles.helpTitle, { color: colors.text }]}>Apunta al codigo del producto</Text>
          <Text style={[styles.helpDescription, { color: colors.textSecondary }]}>
            Se comparara el valor leido con el catalogo local de inventario.
          </Text>
        </View>
      </View>

      {scanStatus === 'not-found' && lastScannedCode ? (
        <ScanResultPanel code={lastScannedCode} onReset={resetScanner} />
      ) : null}

      {scanStatus === 'found' && lastScannedCode && matchedProductTitle ? (
        <ScanFoundPanel code={lastScannedCode} productTitle={matchedProductTitle} />
      ) : null}

      {scanStatus === 'camera-error' ? (
        <ScanErrorPanel message={cameraError} onReset={resetScanner} />
      ) : null}
    </AppScreen>
  );
}

interface PrimaryButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}

function PrimaryButton({ icon, label, onPress }: PrimaryButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: colors.primary,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <Ionicons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

interface ScanFoundPanelProps {
  code: string;
  productTitle: string;
}

function ScanFoundPanel({ code, productTitle }: ScanFoundPanelProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.resultPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.resultIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>Producto encontrado</Text>
        <Text style={[styles.resultDescription, { color: colors.textSecondary }]}>
          {productTitle}
        </Text>
        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Codigo leido</Text>
        <Text style={[styles.codeValue, { color: colors.text }]}>{code}</Text>
      </View>
    </View>
  );
}

interface ScanResultPanelProps {
  code: string;
  onReset: () => void;
}

function ScanResultPanel({ code, onReset }: ScanResultPanelProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.resultPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.resultIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>Producto no registrado</Text>
        <Text style={[styles.resultDescription, { color: colors.textSecondary }]}>
          No encontramos un producto asociado a este codigo.
        </Text>
        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Codigo leido</Text>
        <Text style={[styles.codeValue, { color: colors.text }]}>{code}</Text>
      </View>
      <PrimaryButton label="Escanear nuevamente" icon="refresh-outline" onPress={onReset} />
    </View>
  );
}

interface ScanErrorPanelProps {
  message: string | null;
  onReset: () => void;
}

function ScanErrorPanel({ message, onReset }: ScanErrorPanelProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.resultPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.resultIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="camera-reverse-outline" size={24} color={colors.danger} />
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>No se pudo iniciar la camara</Text>
        <Text style={[styles.resultDescription, { color: colors.textSecondary }]}>
          {message ?? 'Intenta salir de la pantalla y volver a abrir el escaner.'}
        </Text>
      </View>
      <PrimaryButton label="Intentar nuevamente" icon="refresh-outline" onPress={onReset} />
    </View>
  );
}

const styles = StyleSheet.create({
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  codeValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 22,
  },
  helpCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  helpDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  helpText: {
    flex: 1,
    gap: 2,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  resultContent: {
    gap: 6,
  },
  resultDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  resultIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  resultPanel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  stateCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    justifyContent: 'center',
    minHeight: 260,
    padding: 28,
  },
  stateDescription: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 280,
    textAlign: 'center',
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
});
