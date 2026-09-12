import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { invoke } from '@/lib/electron';
import { playSuccess, playError } from '@/lib/sound';
import { useSettings } from '../context/SettingsContext';
import { useAppState } from '../context/AppStateContext';
import { sendMessageToBackend } from '../utils/MessageUtils';

interface BufferedChunk {
  blob: Blob;
  timestamp: number;
}

interface MedalReplayState {
  bufferActive: boolean;
  saving: boolean;
  bufferedSeconds: number;
  lastClipPath: string | null;
  startBuffer: () => Promise<void>;
  stopBuffer: () => void;
  saveReplay: () => Promise<void>;
}

const BUFFER_SLICE_MS = 1000;

async function pickDesktopSourceId(): Promise<string | null> {
  try {
    const sources = (await invoke({ channel: 'segra:get-sources' })) as { id: string; name: string }[];
    if (!sources || sources.length === 0) return null;
    // Prefer primary screen, fallback to first source
    const screen = sources.find((s) => /screen|monitor|display|ecrã|tela/i.test(s.name)) ?? sources[0];
    return screen.id;
  } catch {
    return null;
  }
}

/**
 * Medal-style instant replay:
 * - keeps a rolling buffer (default last 30s) recording in background
 * - global hotkey (F8 by default, Ctrl+Shift+F10 legacy) saves the buffer to disk
 * - works while playing fullscreen because the hotkey is registered in main
 */
export function useMedalReplay(): MedalReplayState {
  const settings = useSettings();
  const appState = useAppState();
  const [bufferActive, setBufferActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bufferedSeconds, setBufferedSeconds] = useState(0);
  const [lastClipPath, setLastClipPath] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BufferedChunk[]>([]);
  const durationRef = useRef(settings.replayBufferDuration || 30);
  const activeRef = useRef(false);
  const savingRef = useRef(false);
  const saveFnRef = useRef<() => Promise<void>>(async () => undefined);
  const notifyRef = useRef(settings.replayNotifications !== false);
  const soundRef = useRef(settings.replaySound !== false);
  const gameRef = useRef('Replay');

  useEffect(() => {
    durationRef.current = settings.replayBufferDuration || 30;
  }, [settings.replayBufferDuration]);
  useEffect(() => {
    notifyRef.current = settings.replayNotifications !== false;
  }, [settings.replayNotifications]);
  useEffect(() => {
    soundRef.current = settings.replaySound !== false;
  }, [settings.replaySound]);
  useEffect(() => {
    gameRef.current = appState.gameList?.[0]?.name || appState.recording?.game || 'Replay';
  }, [appState.gameList, appState.recording]);

  const stopBuffer = useCallback(() => {
    try { recorderRef.current?.stop(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
    recorderRef.current = null;
    streamRef.current = null;
    activeRef.current = false;
    setBufferActive(false);
    setBufferedSeconds(0);
  }, []);

  const saveReplay = useCallback(async () => {
    if (savingRef.current || !activeRef.current || chunksRef.current.length === 0) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const durationSec = durationRef.current;
      const cutoff = Date.now() - durationSec * 1000;
      const recent = chunksRef.current.filter((c) => c.timestamp >= cutoff);
      // Keep first chunk (may hold the webm header) so the clip plays back
      const first = chunksRef.current[0];
      const blobs = first && recent[0] !== first
        ? [first.blob, ...recent.map((c) => c.blob)]
        : recent.map((c) => c.blob);
      const data = await new Blob(blobs, { type: 'video/webm' }).arrayBuffer();
      const result = (await invoke({
        channel: 'segra:SaveReplayClip',
        payload: { data, game: gameRef.current, durationSec },
      })) as { success: boolean; filePath?: string; fileName?: string; error?: string };
      if (result?.success) {
        setLastClipPath(result.filePath || null);
        if (soundRef.current) playSuccess();
        if (notifyRef.current) {
          toast.success(`Clip guardado! Últimos ${durationSec}s — ${result.fileName || ''}`, {
            autoClose: 5000,
          });
        }
      } else {
        if (soundRef.current) playError();
        toast.error('Não foi possível guardar o clip.');
      }
    } catch (err) {
      console.error('[MedalReplay] save failed:', err);
      toast.error('Não foi possível guardar o clip.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    saveFnRef.current = saveReplay;
  }, [saveReplay]);

  const startBuffer = useCallback(async () => {
    if (activeRef.current) return;
    const sourceId = await pickDesktopSourceId();
    let stream: MediaStream;
    try {
      if (sourceId) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
            },
          } as unknown as MediaTrackConstraints,
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      }
    } catch (err) {
      console.error('[MedalReplay] capture failed:', err);
      toast.error('Não foi possível iniciar o replay buffer. Verifique as permissões.');
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    // Medal-like quality mapping: bitrate from resolution/fps settings
    const fps = settings.frameRate >= 60 ? 60 : 30;
    const videoBitsPerSecond = settings.resolution === '720p' ? 6_000_000 : settings.resolution === '1440p' ? 16_000_000 : 12_000_000;
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
    chunksRef.current = [];
    recorder.onerror = () => {
      toast.error('Erro no replay buffer. A reiniciar...');
      stopBuffer();
    };
    recorder.ondataavailable = (event) => {
      if (!event.data || event.data.size === 0) return;
      const now = Date.now();
      chunksRef.current.push({ blob: event.data, timestamp: now });
      // Rolling window: keep duration + 60s headroom so header chunk survives
      const keepFrom = now - Math.max(durationRef.current * 1000 + 60_000, 120_000);
      if (chunksRef.current.length > 0 && now - chunksRef.current[0].timestamp > 5000) {
        chunksRef.current = chunksRef.current.filter((c) => c.timestamp >= keepFrom);
      }
      const oldest = chunksRef.current[0]?.timestamp ?? now;
      setBufferedSeconds(Math.min(Math.round((now - oldest) / 1000), durationRef.current));
    };
    recorder.start(BUFFER_SLICE_MS);
    recorderRef.current = recorder;
    streamRef.current = stream;
    activeRef.current = true;
    setBufferActive(true);
    // Let backend know a session is conceptually recording (for UI badges)
    sendMessageToBackend('StartRecording', { game: gameRef.current });
  }, [settings.frameRate, settings.resolution, stopBuffer]);

  // Global hotkey events from main (F8 + Ctrl+Shift+F10 legacy)
  useEffect(() => {
    const handler = () => { void saveFnRef.current(); };
    window.electron.ipcRenderer.on('segra:save-replay-buffer', handler);
    window.electron.ipcRenderer.on('clips:save-request', handler);
    return () => {
      window.electron.ipcRenderer.removeListener('segra:save-replay-buffer', handler);
      window.electron.ipcRenderer.removeListener('clips:save-request', handler);
    };
  }, []);

  // Medal-style auto buffer: start when a game is detected
  useEffect(() => {
    if (settings.replayAutoBuffer && appState.gameList.length > 0 && !activeRef.current) {
      void startBuffer();
    }
  }, [settings.replayAutoBuffer, appState.gameList, startBuffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recorderRef.current?.stop(); } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      activeRef.current = false;
    };
  }, []);

  return { bufferActive, saving, bufferedSeconds, lastClipPath, startBuffer, stopBuffer, saveReplay };
}

export const MEDAL_DURATION_PRESETS = [15, 30, 45, 60, 120];
