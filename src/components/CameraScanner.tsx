import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

const enabledBarcodeTypes: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
];

interface CameraScannerProps {
  enabled?: boolean;
  onBarcodeScanned: (code: string) => void;
  onCameraError?: (message: string) => void;
}

function CameraScannerComponent({
  enabled = true,
  onBarcodeScanned,
  onCameraError,
}: CameraScannerProps) {
  const { colors } = useAppTheme();

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      const scannedCode = data.trim();

      if (scannedCode.length > 0) {
        onBarcodeScanned(scannedCode);
      }
    },
    [onBarcodeScanned],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <CameraView
        active={enabled}
        barcodeScannerSettings={{ barcodeTypes: enabledBarcodeTypes }}
        facing="back"
        onBarcodeScanned={enabled ? handleBarcodeScanned : undefined}
        onMountError={(event) => onCameraError?.(event.message)}
        style={styles.camera}
      >
        <View pointerEvents="none" style={styles.overlay}>
          <View style={[styles.scanFrame, { borderColor: colors.primary }]}>
            <View style={[styles.scanLine, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={styles.overlayText}>Alinea el codigo dentro del recuadro</Text>
        </View>
      </CameraView>
    </View>
  );
}

export const CameraScanner = memo(CameraScannerComponent);
export { enabledBarcodeTypes };

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  container: {
    aspectRatio: 0.78,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 380,
    overflow: 'hidden',
    width: '100%',
  },
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 18,
    textAlign: 'center',
  },
  scanFrame: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    height: 150,
    justifyContent: 'center',
    width: '82%',
  },
  scanLine: {
    borderRadius: 8,
    height: 2,
    opacity: 0.9,
    width: '82%',
  },
});
