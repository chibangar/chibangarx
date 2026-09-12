import { useState, useEffect, useCallback, useRef } from 'react';
import { PreRecording, Recording, GameSetting } from '../models/types';
import { Gamepad2, Monitor, Ellipsis, Ban } from 'lucide-react';
import { useSettings, useSettingsUpdater } from '../context/SettingsContext';
import { useAppState } from '../context/AppStateContext';
import { sendMessageToBackend } from '../utils/MessageUtils';
import Button from './Button';

const pad = (n: number) => String(n).padStart(2, '0');

interface RecordingCardProps {
  recording?: Recording;
  preRecording?: PreRecording;
}

const RecordingCard: React.FC<RecordingCardProps> = ({ recording, preRecording }) => {
  const timerRef = useRef<HTMLSpanElement>(null);
  const settings = useSettings();
  const showGameBackground = settings.showGameBackground;
  const updateSettings = useSettingsUpdater();
  const state = useAppState();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const lastFetchedGameRef = useRef<string | null>(null);

  const gameName = preRecording ? preRecording.game : recording?.game;
  const gameListEntry = state.gameList.find((g) => g.name === gameName);
  const canBlockGame = !!gameListEntry && gameListEntry.executables.length > 0;

  const handleAddToBlocklist = useCallback(() => {
    if (!gameListEntry) return;
    const games = settings.games.some((g) => g.name === gameListEntry.name)
      ? settings.games.map((g) => (g.name === gameListEntry.name ? { ...g, record: false } : g))
      : [...settings.games, {
          name: gameListEntry.name, paths: gameListEntry.executables, igdbId: gameListEntry.igdbId ?? null,
          icon: gameListEntry.icon, customIcon: null, record: false, qualityOverride: null,
          recordingModeOverride: null, discardSessionsWithoutBookmarksOverride: null,
        } as GameSetting];
    updateSettings({ games });
    sendMessageToBackend('StopRecording');
  }, [gameListEntry, settings.games, updateSettings]);

  useEffect(() => {
    if (preRecording) {
      if (timerRef.current) timerRef.current.textContent = '00:00';
      return;
    }
    if (!recording?.startTime) return;
    const startTime = new Date(recording.startTime).getTime();
    const updateElapsedTime = () => {
      if (!timerRef.current) return;
      const now = Date.now();
      const secondsElapsed = Math.max(0, Math.floor((now - startTime) / 1000));
      const hours = Math.floor(secondsElapsed / 3600);
      const minutes = Math.floor((secondsElapsed % 3600) / 60);
      const seconds = secondsElapsed % 60;
      timerRef.current.textContent = hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
    };
    updateElapsedTime();
    const intervalId = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(intervalId);
  }, [recording?.startTime, preRecording]);

  useEffect(() => {
    if (!showGameBackground) { setCoverUrl(null); return; }
    const gn = preRecording ? preRecording.game : recording?.game;
    if (!gn || gn === 'Manual Recording') { setCoverUrl(null); return; }
    const coverImageId = recording?.coverImageId || preRecording?.coverImageId;
    if (coverImageId) {
      setCoverUrl(`https://segra.tv/api/games/cover/${coverImageId}`);
      lastFetchedGameRef.current = gn;
      return;
    }
    if (lastFetchedGameRef.current === gn) return;
    fetch(`https://segra.tv/api/games/search?name=${encodeURIComponent(gn)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.game?.cover?.image_id) setCoverUrl(`https://segra.tv/api/games/cover/${data.game.cover.image_id}`);
        lastFetchedGameRef.current = gn;
      })
      .catch(() => { setCoverUrl(null); lastFetchedGameRef.current = gn; });
  }, [preRecording, recording, showGameBackground]);

  return (
    <div className="mb-2 px-2">
      <div className="group bg-chibangarx-card border border-chibangarx-border rounded-lg px-3 py-3.5 cursor-default relative">
        {coverUrl && showGameBackground && (
          <div className="absolute inset-0 z-0 opacity-25 rounded-lg overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          </div>
        )}
        <div className="flex items-center justify-between mb-1 relative z-10">
          <div className="flex items-center">
            <span className={`w-3 h-3 shrink-0 rounded-full mr-1.5 ${preRecording ? 'bg-orange-500' : 'bg-red-500'}`} />
            <span className="text-chibangarx-text text-sm font-medium">
              {preRecording ? preRecording.status : 'Recording'}
            </span>
            {!preRecording && (
              <div className="ml-1.5" title={`${recording?.isUsingGameHook ? 'Game capture' : 'Display capture'}`}>
                {recording?.isUsingGameHook ? <Gamepad2 className="h-4 w-4 text-chibangarx-text-secondary" /> : <Monitor className="h-4 w-4 text-chibangarx-text-secondary" />}
              </div>
            )}
          </div>
          {canBlockGame && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 rounded hover:bg-chibangarx-border-secondary" onClick={handleAddToBlocklist}>
                <Ban className="h-4 w-4 text-chibangarx-text-secondary" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center text-chibangarx-text-secondary text-sm relative z-10">
          <span ref={timerRef} className="tabular-nums">00:00</span>
          <p className="truncate ml-2">{preRecording ? preRecording.game : recording?.game}</p>
        </div>
      </div>
    </div>
  );
};

export default RecordingCard;
