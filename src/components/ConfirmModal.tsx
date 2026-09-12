import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface ConfirmModalProps {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}

// Dialogo de confirmacion generico y reutilizable (no conoce catalogo, auditorias ni GPS).
// Se implementa con el `Modal` nativo de react-native en vez de un componente de Gluestack UI:
// este proyecto solo tiene instalados `@gluestack-ui/core` y `@gluestack-ui/utils` (el proveedor
// de tema), no la libreria completa de componentes, por lo que se sigue el mismo patron ya usado
// en el resto de la app (paneles/tarjetas construidos a mano con los tokens de useAppTheme()).
// Ademas, `Alert.alert` de React Native no muestra ninguna interfaz en Expo Web (es un no-op),
// por lo que un dialogo propio es necesario para que la confirmacion funcione en todas las plataformas.
export function ConfirmModal({
  cancelLabel = 'Cancelar',
  confirmLabel,
  description,
  errorMessage,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Cerrar" onPress={onCancel} style={StyleSheet.absoluteFill} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

          {errorMessage ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={cancelLabel}
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}>
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              accessibilityLabel={confirmLabel}
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
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
    gap: 10,
    maxWidth: 360,
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
});
