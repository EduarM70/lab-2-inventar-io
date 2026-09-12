import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ComponentProps, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AudioRecorder } from '@/components/AudioRecorder';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { useAudit } from '@/hooks/useAudit';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCatalog } from '@/hooks/useCatalog';
import { LocationRequestError, useCurrentLocation } from '@/hooks/useCurrentLocation';
import { AuditDraft, AuditDraftActionType } from '@/types/AuditDraft';
import { AuditEntry } from '@/types/AuditEntry';
import { getActionTypeLabel } from '@/utils/actionLabels';
import { createTimestamp } from '@/utils/createTimestamp';
import { formatDateTime } from '@/utils/formatDateTime';
import { generateId } from '@/utils/generateId';

interface AuditOption {
  actionType: AuditDraftActionType;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
}

const auditOptions: AuditOption[] = [
  {
    actionType: 'AUDIT_CHECK',
    description: 'El producto fue revisado y coincide con el stock esperado.',
    icon: 'checkmark-circle-outline',
    title: 'Stock verificado correctamente',
  },
  {
    actionType: 'INCIDENCE',
    description: 'Utiliza esta opcion cuando detectes un faltante, dano u otra anomalia.',
    icon: 'warning-outline',
    title: 'Registrar incidencia',
  },
];

// Estado tipado del proceso de registro: cubre IDLE, OBTENIENDO UBICACION, GUARDANDO,
// ERROR (de permiso o de GPS) y COMPLETADO sin necesidad de una maquina de estados compleja.
type RegistrationState =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'saving' }
  | { kind: 'error'; error: LocationRequestError }
  | { kind: 'success'; entry: AuditEntry };

export default function AuditProductScreen() {
  const { colors } = useAppTheme();
  const { addAuditEntry } = useAudit();
  const { products } = useCatalog();
  const { getCurrentLocation } = useCurrentLocation();
  const { productId: rawProductId } = useLocalSearchParams<{ productId?: string | string[] }>();
  const [selectedAction, setSelectedAction] = useState<AuditDraftActionType | undefined>();
  const [audioNoteUrl, setAudioNoteUrl] = useState<string | undefined>();
  const [preparedDraft, setPreparedDraft] = useState<AuditDraft | undefined>();
  const [registrationState, setRegistrationState] = useState<RegistrationState>({ kind: 'idle' });

  // Protege contra doble tap incluso antes de que React vuelva a renderizar con el nuevo estado.
  const isProcessingRef = useRef(false);

  // Expo Router puede entregar parametros repetidos como arreglo; el flujo solo acepta un producto.
  const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;

  // FASE 9: la fuente de verdad en runtime es CatalogContext, no products.ts directamente.
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return (
      <AppScreen edges={['left', 'right', 'bottom']}>
        <EmptyState
          title="Producto no encontrado"
          description="El producto solicitado no existe en el catalogo."
          icon={<Ionicons name="alert-circle-outline" size={30} color={colors.textSecondary} />}
        />
        <Pressable
          accessibilityLabel="Volver al inventario"
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Volver al inventario</Text>
        </Pressable>
      </AppScreen>
    );
  }

  const handleSelectAction = (actionType: AuditDraftActionType) => {
    setSelectedAction(actionType);
    setPreparedDraft(undefined);
  };

  const handlePrepareDraft = () => {
    if (!selectedAction) {
      return;
    }

    // El draft separa la seleccion del usuario del AuditEntry final, que aun requiere GPS real.
    // La nota de voz es opcional: si no se grabo ninguna, audioNoteUrl queda undefined.
    setPreparedDraft({
      actionType: selectedAction,
      productId: product.id,
      productTitle: product.title,
      audioNoteUrl,
    });
    setRegistrationState({ kind: 'idle' });
  };

  const handleRegisterAudit = async () => {
    if (!preparedDraft || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setRegistrationState({ kind: 'locating' });

    try {
      const coordinates = await getCurrentLocation();

      setRegistrationState({ kind: 'saving' });

      // El timestamp se genera aqui, justo antes de guardar, para representar el momento real del registro.
      // audioNoteUrl es opcional: si no existe, se omite (nunca se guarda como cadena vacia).
      const entry: AuditEntry = {
        id: generateId(),
        productId: preparedDraft.productId,
        productTitle: preparedDraft.productTitle,
        timestamp: createTimestamp(),
        actionType: preparedDraft.actionType,
        ...(preparedDraft.audioNoteUrl ? { audioNoteUrl: preparedDraft.audioNoteUrl } : {}),
        location: coordinates,
      };

      addAuditEntry(entry);
      setRegistrationState({ kind: 'success', entry });
    } catch (error: unknown) {
      const locationError =
        error instanceof LocationRequestError
          ? error
          : new LocationRequestError('unavailable', 'No pudimos obtener tu ubicacion');

      setRegistrationState({ kind: 'error', error: locationError });
      isProcessingRef.current = false;
      return;
    }

    // isProcessingRef se mantiene en true tras exito: la pantalla de exito ya no muestra el boton de registro.
  };

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  if (registrationState.kind === 'success') {
    const { entry } = registrationState;

    return (
      <AppScreen edges={['left', 'right', 'bottom']}>
        <SectionHeader
          title="Auditoria registrada"
          description="El registro fue guardado correctamente."
        />

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <View style={[styles.successIcon, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="checkmark-circle-outline" size={26} color={colors.success} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.productTitle, { color: colors.text }]}>{entry.productTitle}</Text>

            <View style={styles.resultRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Resultado</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {getActionTypeLabel(entry.actionType)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Hora</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {formatDateTime(entry.timestamp)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Ubicacion</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>Registrada correctamente</Text>
            </View>

            {entry.audioNoteUrl ? (
              <View style={styles.resultRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Nota de voz</Text>
                <AudioPlayer uri={entry.audioNoteUrl} label="Reproducir nota" />
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityLabel="Ver bitacora"
          accessibilityRole="button"
          onPress={() => router.push('/audit-log')}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Ionicons name="clipboard-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Ver bitacora</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Volver al inventario"
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Volver al inventario</Text>
        </Pressable>
      </AppScreen>
    );
  }

  if (preparedDraft) {
    const isBusy = registrationState.kind === 'locating' || registrationState.kind === 'saving';
    const busyLabel =
      registrationState.kind === 'locating' ? 'Obteniendo ubicacion...' : 'Guardando...';

    return (
      <AppScreen edges={['left', 'right', 'bottom']}>
        <SectionHeader
          title="Auditoria preparada"
          description="El siguiente paso registrara la ubicacion del dispositivo."
        />

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <View style={[styles.successIcon, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="clipboard-outline" size={26} color={colors.success} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.productTitle, { color: colors.text }]}>
              {preparedDraft.productTitle}
            </Text>
            <View style={styles.resultRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Resultado</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {getActionTypeLabel(preparedDraft.actionType)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Nota de voz</Text>
              {preparedDraft.audioNoteUrl ? (
                <AudioPlayer uri={preparedDraft.audioNoteUrl} label="Reproducir nota" />
              ) : (
                <Text style={[styles.resultValue, { color: colors.text }]}>Sin nota de voz</Text>
              )}
            </View>
          </View>
        </View>

        {registrationState.kind === 'error' ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.errorPanel,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.danger,
              },
            ]}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
            <View style={styles.errorContent}>
              <Text style={[styles.errorTitle, { color: colors.text }]}>
                {registrationState.error.kind === 'permission-denied'
                  ? 'Se necesita acceso a la ubicacion'
                  : 'No pudimos obtener tu ubicacion'}
              </Text>
              <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
                {registrationState.error.kind === 'permission-denied'
                  ? 'La ubicacion es necesaria para registrar donde se realizo esta auditoria.'
                  : 'Verifica que la ubicacion del dispositivo este activada e intentalo nuevamente.'}
              </Text>

              <View style={styles.errorActions}>
                <Pressable
                  accessibilityLabel="Intentar nuevamente"
                  accessibilityRole="button"
                  onPress={handleRegisterAudit}
                  style={({ pressed }) => [
                    styles.retryButton,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <Text style={styles.retryButtonText}>
                    {registrationState.error.kind === 'permission-denied'
                      ? 'Intentar nuevamente'
                      : 'Reintentar'}
                  </Text>
                </Pressable>

                {registrationState.error.kind === 'permission-denied' &&
                !registrationState.error.canAskAgain ? (
                  <Pressable
                    accessibilityLabel="Abrir configuracion"
                    accessibilityRole="button"
                    onPress={handleOpenSettings}
                    style={({ pressed }) => [
                      styles.retryButtonOutline,
                      { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                    ]}>
                    <Text style={[styles.retryButtonOutlineText, { color: colors.text }]}>
                      Abrir configuracion
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.pendingPanel,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}>
            <Ionicons name="location-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
              La ubicacion se solicitara al presionar &quot;Registrar auditoria&quot;.
            </Text>
          </View>
        )}

        <Pressable
          accessibilityLabel="Registrar auditoria"
          accessibilityRole="button"
          accessibilityState={{ disabled: isBusy }}
          disabled={isBusy}
          onPress={handleRegisterAudit}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: isBusy ? colors.surfaceSecondary : colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          {isBusy ? (
            <>
              <ActivityIndicator color={colors.textSecondary} />
              <Text style={[styles.primaryButtonText, { color: colors.textSecondary }]}>
                {busyLabel}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Registrar auditoria</Text>
            </>
          )}
        </Pressable>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['left', 'right', 'bottom']}>
      <SectionHeader
        title="Realizar auditoria"
        description="Selecciona el resultado principal de la revision."
      />

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={[styles.productIcon, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="cube-outline" size={26} color={colors.primary} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={[styles.productTitle, { color: colors.text }]}>{product.title}</Text>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{product.category}</Text>
          <View style={[styles.stockBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Stock esperado</Text>
            <Text style={[styles.stockValue, { color: colors.text }]}>
              {product.expectedStock} unidades
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.optionGroup}>
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
          Resultado de auditoria
        </Text>

        {auditOptions.map((option) => {
          const isSelected = selectedAction === option.actionType;

          return (
            <Pressable
              accessibilityLabel={option.title}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              key={option.actionType}
              onPress={() => handleSelectAction(option.actionType)}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <View
                style={[
                  styles.radioIndicator,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}>
                {isSelected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
              </View>
              <View style={styles.optionText}>
                <View style={styles.optionTitleRow}>
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                </View>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <AudioRecorder value={audioNoteUrl} onChange={setAudioNoteUrl} />

      <Pressable
        accessibilityLabel="Continuar"
        accessibilityRole="button"
        accessibilityState={{ disabled: !selectedAction }}
        disabled={!selectedAction}
        onPress={handlePrepareDraft}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: selectedAction ? colors.primary : colors.surfaceSecondary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <Text
          style={[
            styles.primaryButtonText,
            { color: selectedAction ? '#FFFFFF' : colors.textSecondary },
          ]}>
          Continuar
        </Text>
        <Ionicons
          name="arrow-forward-outline"
          size={20}
          color={selectedAction ? '#FFFFFF' : colors.textSecondary}
        />
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  errorContent: {
    flex: 1,
    gap: 6,
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorPanel: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  optionCard: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    minHeight: 112,
    padding: 16,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionGroup: {
    gap: 12,
  },
  optionText: {
    flex: 1,
    gap: 8,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  optionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pendingPanel: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
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
  productIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  radioIndicator: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  resultRow: {
    gap: 4,
  },
  resultValue: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
  },
  retryButtonOutline: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
  },
  retryButtonOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  stockBox: {
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
    padding: 12,
  },
  stockValue: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  successIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  summaryCard: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  summaryContent: {
    flex: 1,
    gap: 10,
  },
});
