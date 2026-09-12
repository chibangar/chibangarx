import { History, Video, Square, Scissors } from 'lucide-react';
import ContentPage from './components/ContentPage';
import { useMedalReplayOptional } from './context/MedalReplayContext';
import { useSettings } from './context/SettingsContext';

export default function ReplayBuffer() {
  const replay = useMedalReplayOptional();
  const settings = useSettings();

  return (
    <div className="h-full flex flex-col">
      <div className="mx-5 mt-5 p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${replay?.bufferActive ? 'bg-red-500 animate-pulse' : 'bg-chibangarx-border'}`} />
          <div>
            <div className="text-sm font-semibold text-chibangarx-text">
              {replay?.bufferActive ? `A gravar buffer (${replay.bufferedSeconds}s / ${settings.replayBufferDuration}s)` : 'Replay buffer parado'}
            </div>
            <div className="text-xs text-chibangarx-text-secondary">
              Prime {settings.replayHotkey || 'F8'} em pleno jogo para guardar o clip — como no Medal
            </div>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          {!replay?.bufferActive ? (
            <button
              onClick={() => void replay?.startBuffer()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-chibangarx-primary text-white hover:opacity-90"
            >
              <Video size={16} /> Iniciar replay
            </button>
          ) : (
            <>
              <button
                onClick={() => void replay?.saveReplay()}
                disabled={replay?.saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-chibangarx-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                <Scissors size={16} /> {replay?.saving ? 'A guardar...' : 'Clipar agora'}
              </button>
              <button
                onClick={() => replay?.stopBuffer()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-chibangarx-border text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary"
              >
                <Square size={16} /> Parar
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ContentPage
          contentType="Buffer"
          sectionId="replayBuffer"
          title="Replay Buffer"
          Icon={History}
        />
      </div>
    </div>
  );
}
