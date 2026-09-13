import { Ionicons } from "@expo/vector-icons";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AudioPlayer } from "@/components/AudioPlayer";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDuration } from "@/utils/formatDuration";

type AudioErrorKind = "permission-denied" | "recording-failed";

class AudioRecordingError extends Error {
  readonly kind: AudioErrorKind;
  readonly canAskAgain: boolean;

  constructor(kind: AudioErrorKind, message: string, canAskAgain = true) {
    super(message);
    this.name = "AudioRecordingError";
    this.kind = kind;
    this.canAskAgain = canAskAgain;
  }
}

// Estado local del componente: solo cubre las transiciones. El estado "grabacion lista"
// se deriva directamente de la prop `value` (URI controlada por la pantalla que lo usa).
type RecorderStatus =
  | { kind: "idle" }
  | { kind: "requesting-permission" }
  | { kind: "recording" }
  | { kind: "error"; error: AudioRecordingError };

interface AudioRecorderProps {
  value?: string;
  onChange: (uri?: string) => void;
}

// AudioRecorder es reutilizable e independiente del dominio: no crea AuditEntry, no conoce
// products.ts, no conoce AuditContext, no navega y no maneja GPS. Solo produce una URI de audio.
export function AudioRecorder({ value, onChange }: AudioRecorderProps) {
  const { colors } = useAppTheme();
  // FASE 9: se guarda en el directorio de documentos (persistente) en vez del cache por defecto,
  // para que la nota de voz sobreviva a cierres de la app y a limpiezas de cache del sistema en
  // Android/iOS. `directory` es una opcion nativa de expo-audio (sin dependencias nuevas); en Web
  // no aplica y se ignora sin error.
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: "document",
  });
  const recorderState = useAudioRecorderState(audioRecorder, 500);
  const [status, setStatus] = useState<RecorderStatus>({ kind: "idle" });

  // Evita solicitudes de permiso/inicio duplicadas mientras una operacion asincrona esta en curso.
  const isBusyRef = useRef(false);
  // Copia JS de "esta grabando": useAudioRecorder libera el SharedObject nativo en su propio
  // cleanup, que React puede ejecutar ANTES que este efecto. Leer audioRecorder.isRecording
  // despues de ese release lanza NotFoundException (el getter cruza a Swift).
  const isRecordingRef = useRef(false);

  // Si el usuario navega hacia atras mientras graba, se intenta liberar el microfono.
  // Best-effort: si el objeto nativo ya no existe (unmount / Fast Refresh), se ignora.
  useEffect(() => {
    return () => {
      if (!isRecordingRef.current) {
        return;
      }

      isRecordingRef.current = false;

      try {
        void audioRecorder.stop().catch(() => undefined);
      } catch {
        // Native shared object already released; nothing left to stop.
      }
    };
  }, [audioRecorder]);

  const handleStartRecording = async () => {
    if (isBusyRef.current || status.kind === "recording") {
      return;
    }

    isBusyRef.current = true;
    setStatus({ kind: "requesting-permission" });

    try {
      const permissionResponse = await requestRecordingPermissionsAsync();

      if (!permissionResponse.granted) {
        throw new AudioRecordingError(
          "permission-denied",
          "No se pudo acceder al microfono",
          permissionResponse.canAskAgain,
        );
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      isRecordingRef.current = true;
      setStatus({ kind: "recording" });
    } catch (error: unknown) {
      const recordingError =
        error instanceof AudioRecordingError
          ? error
          : new AudioRecordingError(
              "recording-failed",
              "No se pudo iniciar la grabacion",
            );

      setStatus({ kind: "error", error: recordingError });
    } finally {
      isBusyRef.current = false;
    }
  };

  const handleStopRecording = async () => {
    if (status.kind !== "recording" || isBusyRef.current) {
      return;
    }

    isBusyRef.current = true;

    try {
      await audioRecorder.stop();
      isRecordingRef.current = false;
      const uri = audioRecorder.uri;

      if (!uri) {
        throw new AudioRecordingError(
          "recording-failed",
          "No pudimos obtener la nota grabada",
        );
      }

      setStatus({ kind: "idle" });
      onChange(uri);
    } catch (error: unknown) {
      const recordingError =
        error instanceof AudioRecordingError
          ? error
          : new AudioRecordingError(
              "recording-failed",
              "No pudimos detener la grabacion",
            );

      setStatus({ kind: "error", error: recordingError });
    } finally {
      isBusyRef.current = false;
    }
  };

  const handleDelete = () => {
    // Solo la ultima grabacion activa debe quedar asociada; eliminar limpia la URI y permite regrabar.
    onChange(undefined);
    setStatus({ kind: "idle" });
  };

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  if (status.kind === "recording") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.danger,
          },
        ]}
      >
        <View style={styles.recordingRow}>
          <View
            style={[styles.recordingDot, { backgroundColor: colors.danger }]}
          />
          <Text style={[styles.recordingLabel, { color: colors.text }]}>
            Grabando
          </Text>
          <Text style={[styles.duration, { color: colors.textSecondary }]}>
            {formatDuration(recorderState.durationMillis)}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Detener grabacion"
          accessibilityRole="button"
          onPress={handleStopRecording}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.danger, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Ionicons name="square-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Detener grabacion</Text>
        </Pressable>
      </View>
    );
  }

  if (status.kind === "error") {
    return (
      <View
        accessibilityRole="alert"
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.danger,
          },
        ]}
      >
        <View style={styles.errorHeader}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={colors.danger}
          />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {status.error.kind === "permission-denied"
              ? "No se pudo acceder al microfono"
              : "No se pudo completar la grabacion"}
          </Text>
        </View>
        <Text
          style={[styles.errorDescription, { color: colors.textSecondary }]}
        >
          Puedes continuar con la auditoria sin agregar una nota de voz.
        </Text>

        <View style={styles.errorActions}>
          <Pressable
            accessibilityLabel="Intentar nuevamente"
            accessibilityRole="button"
            onPress={handleStartRecording}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.retryButtonText}>Intentar nuevamente</Text>
          </Pressable>

          {status.error.kind === "permission-denied" &&
          !status.error.canAskAgain ? (
            <Pressable
              accessibilityLabel="Abrir configuracion"
              accessibilityRole="button"
              onPress={handleOpenSettings}
              style={({ pressed }) => [
                styles.retryButtonOutline,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text
                style={[styles.retryButtonOutlineText, { color: colors.text }]}
              >
                Abrir configuracion
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  if (value) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Nota grabada
        </Text>

        <View style={styles.previewRow}>
          <View style={styles.previewPlayer}>
            <AudioPlayer uri={value} />
          </View>

          <Pressable
            accessibilityLabel="Eliminar nota"
            accessibilityRole="button"
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>
              Eliminar
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isRequestingPermission = status.kind === "requesting-permission";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Nota de voz
        </Text>
        <View
          style={[
            styles.optionalBadge,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Text
            style={[styles.optionalBadgeText, { color: colors.textSecondary }]}
          >
            Opcional
          </Text>
        </View>
      </View>
      <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
        Puedes agregar una observacion de audio a esta auditoria.
      </Text>

      <Pressable
        accessibilityLabel="Grabar nota"
        accessibilityRole="button"
        accessibilityState={{ disabled: isRequestingPermission }}
        disabled={isRequestingPermission}
        onPress={handleStartRecording}
        style={({ pressed }) => [
          styles.actionButtonOutline,
          { borderColor: colors.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        {isRequestingPermission ? (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text
              style={[
                styles.actionButtonOutlineText,
                { color: colors.primary },
              ]}
            >
              Solicitando permiso...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="mic-outline" size={18} color={colors.primary} />
            <Text
              style={[
                styles.actionButtonOutlineText,
                { color: colors.primary },
              ]}
            >
              Grabar nota
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
  },
  actionButtonOutline: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
  },
  actionButtonOutlineText: {
    fontSize: 14,
    fontWeight: "700",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  duration: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    marginLeft: "auto",
  },
  errorActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  errorDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  errorHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  errorTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  optionalBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  previewPlayer: {
    flex: 1,
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recordingDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  recordingLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  recordingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  retryButton: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
  },
  retryButtonOutline: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
  },
  retryButtonOutlineText: {
    fontSize: 14,
    fontWeight: "700",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
});
