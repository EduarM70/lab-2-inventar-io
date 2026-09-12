import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { UpdateBarcodeResult } from '@/context/CatalogContext';

interface EditBarcodeModalProps {
  currentBarcode: string;
  onClose: () => void;
  onSubmit: (barcode: string) => Promise<UpdateBarcodeResult>;
  productTitle: string;
  visible: boolean;
}

// Modal implementado con el `Modal` nativo de react-native (ver nota de arquitectura en
// ConfirmModal.tsx: este proyecto no tiene instalada la libreria completa de componentes de
// Gluestack UI, solo el proveedor de tema). No conoce AuditContext ni GPS; solo edita un barcode.
export function EditBarcodeModal({
  currentBarcode,
  onClose,
  onSubmit,
  productTitle,
  visible,
}: EditBarcodeModalProps) {
  const { colors } = useAppTheme();
  const [value, setValue] = useState(currentBarcode);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cada vez que el modal se abre, se reinicia con el barcode actual y sin errores previos.
  useEffect(() => {
    if (visible) {
      setValue(currentBarcode);
      setErrorMessage(undefined);
      setIsSubmitting(false);
    }
  }, [visible, currentBarcode]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    const result = await onSubmit(value);

    setIsSubmitting(false);

    if (result.success) {
      onClose();
      return;
    }

    setErrorMessage(result.message);
  };

  return (
    <Modal animationType="fade" onRequestClose={handleClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <Text style={[styles.title, { color: colors.text }]}>Editar codigo de barras</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Puedes utilizar el codigo de un producto fisico para probar el escaner de{' '}
            {productTitle}.
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Codigo de barras</Text>
            <TextInput
              accessibilityLabel="Codigo de barras"
              autoCapitalize="none"
              autoCorrect={false}
              // Se evita number-pad a proposito: Code128/Code39 pueden incluir letras, y esta
              // pantalla no debe bloquear formatos validos solo por restringir el teclado.
              onChangeText={(text) => {
                setValue(text);
                setErrorMessage(undefined);
              }}
              placeholder="Ej. 7501234567890"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: errorMessage ? colors.danger : colors.border,
                  color: colors.text,
                },
              ]}
              value={value}
            />
          </View>

          {errorMessage ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
          ) : (
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              El codigo debe ser unico dentro del catalogo.
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Cancelar"
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleClose}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}>
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Guardar codigo de barras"
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary, opacity: pressed || isSubmitting ? 0.9 : 1 },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 18,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
    maxWidth: 380,
    padding: 20,
    width: '100%',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 0.5,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
});
