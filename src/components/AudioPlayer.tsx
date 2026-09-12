import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDuration } from '@/utils/formatDuration';

interface AudioPlayerProps {
  uri: string;
  label?: string;
}

// Componente aislado: solo conoce una URI de audio. No conoce AuditEntry, Product, GPS ni el Context.
// useAudioPlayer administra el ciclo de vida del reproductor (incluida la liberacion al desmontar).
export function AudioPlayer({ uri, label = 'Reproducir nota' }: AudioPlayerProps) {
  const { colors } = useAppTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const handleToggle = useCallback(() => {
    if (status.playing) {
      player.pause();
      return;
    }

    // Si la reproduccion anterior ya termino, hay que rebobinar antes de volver a reproducir.
    if (status.didJustFinish) {
      player.seekTo(0);
    }

    player.play();
  }, [player, status.didJustFinish, status.playing]);

  const durationSeconds = status.playing ? status.currentTime : status.duration;

  return (
    <Pressable
      accessibilityLabel={status.playing ? 'Pausar nota de voz' : label}
      accessibilityRole="button"
      onPress={handleToggle}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <Ionicons
        name={status.playing ? 'pause-outline' : 'play-outline'}
        size={18}
        color={colors.primary}
      />
      <Text style={[styles.label, { color: colors.text }]}>{status.playing ? 'Pausar' : label}</Text>
      {status.isLoaded ? (
        <Text style={[styles.duration, { color: colors.textSecondary }]}>
          {formatDuration(Math.round(durationSeconds * 1000))}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  duration: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
