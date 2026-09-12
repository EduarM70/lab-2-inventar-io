import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AudioPlayer } from '@/components/AudioPlayer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AuditEntry } from '@/types/AuditEntry';
import { getActionTypeLabel } from '@/utils/actionLabels';
import { formatDateTime } from '@/utils/formatDateTime';

interface AuditLogItemProps {
  entry: AuditEntry;
}

export function AuditLogItem({ entry }: AuditLogItemProps) {
  const { colors } = useAppTheme();
  const isIncidence = entry.actionType === 'INCIDENCE';
  const accentColor = isIncidence ? colors.warning : colors.success;

  return (
    <View
      accessibilityLabel={`${entry.productTitle}, ${getActionTypeLabel(entry.actionType)}`}
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons
          name={isIncidence ? 'warning-outline' : 'checkmark-circle-outline'}
          size={22}
          color={accentColor}
        />
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {entry.productTitle}
        </Text>
        <Text style={[styles.actionLabel, { color: accentColor }]}>
          {getActionTypeLabel(entry.actionType)}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {formatDateTime(entry.timestamp)}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {entry.location.latitude.toFixed(5)}, {entry.location.longitude.toFixed(5)}
        </Text>

        {entry.audioNoteUrl ? (
          <View style={styles.audioRow}>
            <AudioPlayer uri={entry.audioNoteUrl} label="Reproducir nota" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  audioRow: {
    marginTop: 4,
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});
