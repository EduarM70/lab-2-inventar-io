import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { products } from '@/data/products';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AuditDraft, AuditDraftActionType } from '@/types/AuditDraft';

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

const actionLabels: Record<AuditDraftActionType, string> = {
  AUDIT_CHECK: 'Stock verificado correctamente',
  INCIDENCE: 'Incidencia',
};

export default function AuditProductScreen() {
  const { colors } = useAppTheme();
  const { productId: rawProductId } = useLocalSearchParams<{ productId?: string | string[] }>();
  const [selectedAction, setSelectedAction] = useState<AuditDraftActionType | undefined>();
  const [preparedDraft, setPreparedDraft] = useState<AuditDraft | undefined>();

  // Expo Router puede entregar parametros repetidos como arreglo; el flujo solo acepta un producto.
  const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;

  // products.ts se mantiene como fuente de verdad para catalogo, scanner y auditoria.
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
    setPreparedDraft({
      actionType: selectedAction,
      productId: product.id,
      productTitle: product.title,
    });
  };

  if (preparedDraft) {
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
                {actionLabels[preparedDraft.actionType]}
              </Text>
            </View>
          </View>
        </View>

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
            Ubicacion pendiente. La captura GPS se implementara en la siguiente fase.
          </Text>
        </View>

        <View
          accessibilityState={{ disabled: true }}
          style={[
            styles.disabledButton,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}>
          <Ionicons name="navigate-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.disabledButtonText, { color: colors.textSecondary }]}>
            Registrar ubicacion
          </Text>
        </View>
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
  disabledButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  disabledButtonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
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
