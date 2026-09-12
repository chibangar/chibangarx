import { useState } from 'react';
import { Keyboard, Bell, Volume2, Gamepad2, FolderOpen, FlaskConical } from 'lucide-react';
import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';
import { useMedalReplayOptional } from '../../context/MedalReplayContext';
import { MEDAL_DURATION_PRESETS } from '../../hooks/useMedalReplay';
import { invoke } from '@/lib/electron';

export default function ReplayBufferSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();
  const replay = useMedalReplayOptional();
  const [listeningKey, setListeningKey] = useState(false);
  const [hotkeyError, setHotkeyError] = useState('');

  const applyHotkey = async (hotkey: string) => {
    const normalized = hotkey.toUpperCase();
    const result = (await invoke({
      channel: 'segra:SetReplayHotkey',
      payload: { hotkey: normalized },
    })) as { success: boolean; hotkey?: string };
    if (result?.success) {
      updateSettings({ replayHotkey: result.hotkey || normalized });
      setHotkeyError('');
    } else {
      setHotkeyError('Essa tecla não pode ser usada globalmente. Tente F8 ou F9.');
    }
    setListeningKey(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Instant Replay (estilo Medal)</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">
          Gravação contínua em segundo plano. Prime a hotkey em pleno jogo e os últimos segundos são guardados como clip.
        </p>
      </div>

      {/* Status + quick actions */}
      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl flex flex-wrap items-center gap-3">
        <span className={`flex items-center gap-2 text-sm font-medium ${replay?.bufferActive ? 'text-green-500' : 'text-chibangarx-text-secondary'}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${replay?.bufferActive ? 'bg-green-500 animate-pulse' : 'bg-chibangarx-border'}`} />
          {replay?.bufferActive ? `Buffer ativo (${replay.bufferedSeconds}s)` : 'Buffer parado'}
        </span>
        <div className="ml-auto flex gap-2">
          {!replay?.bufferActive ? (
            <button
              onClick={() => void replay?.startBuffer()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-chibangarx-primary text-white hover:opacity-90"
            >
              Iniciar buffer
            </button>
          ) : (
            <>
              <button
                onClick={() => void replay?.saveReplay()}
                disabled={replay?.saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-chibangarx-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {replay?.saving ? 'A guardar...' : `Clipar últimos ${settings.replayBufferDuration}s`}
              </button>
              <button
                onClick={() => replay?.stopBuffer()}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-chibangarx-border text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary"
              >
                Parar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Duration presets like Medal */}
      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl">
        <div className="text-sm font-medium text-chibangarx-text mb-2">Duração do clip</div>
        <div className="flex flex-wrap gap-2">
          {MEDAL_DURATION_PRESETS.map((secs) => (
            <button
              key={secs}
              onClick={() => updateSettings({ replayBufferDuration: secs })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                settings.replayBufferDuration === secs
                  ? 'border-chibangarx-primary bg-chibangarx-primary/15 text-chibangarx-primary'
                  : 'border-chibangarx-border text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary'
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>
      </div>

      {/* Hotkey */}
      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <Keyboard className="w-5 h-5 text-chibangarx-primary" />
          <div>
            <div className="text-sm font-medium text-chibangarx-text">Hotkey global de clip</div>
            <div className="text-xs text-chibangarx-text-secondary">Funciona mesmo com o jogo em ecrã inteiro (como o Medal)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1.5 rounded-lg bg-chibangarx-bg border border-chibangarx-border text-sm font-mono text-chibangarx-primary">
            {settings.replayHotkey || 'F8'}
          </kbd>
          <button
            onClick={() => setListeningKey(true)}
            className="px-3 py-1.5 rounded-lg text-sm border border-chibangarx-border text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary"
          >
            {listeningKey ? 'Prime uma tecla...' : 'Alterar'}
          </button>
          {listeningKey && (
            <input
              autoFocus
              placeholder=""
              onKeyDown={(e) => {
                e.preventDefault();
                const key = e.key.toUpperCase();
                void applyHotkey(key);
              }}
              onBlur={() => setListeningKey(false)}
              className="w-32 bg-chibangarx-bg border border-chibangarx-primary rounded-lg px-3 py-1.5 text-sm text-chibangarx-text focus:outline-none"
            />
          )}
        </div>
        {hotkeyError && <p className="text-xs text-red-500">{hotkeyError}</p>}
        <p className="text-xs text-chibangarx-text-secondary">Alternativa fixa: Ctrl + Shift + F10</p>
      </div>

      {/* Toggles */}
      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
        {[
          {
            icon: Gamepad2,
            label: 'Iniciar buffer quando um jogo é detetado',
            desc: 'Replay automático ao abrir CS2, Valorant, Fortnite, etc.',
            value: settings.replayAutoBuffer,
            key: 'replayAutoBuffer' as const,
          },
          {
            icon: Bell,
            label: 'Notificação "Clip guardado!"',
            desc: 'Notificação nativa do Windows + toast na app',
            value: settings.replayNotifications,
            key: 'replayNotifications' as const,
          },
          {
            icon: Volume2,
            label: 'Som ao guardar clip',
            desc: 'Confirmação sonora estilo Medal',
            value: settings.replaySound,
            key: 'replaySound' as const,
          },
          {
            icon: FolderOpen,
            label: 'Guardar em "Replay Buffer" em vez de "Clips"',
            desc: 'Separa instant replays dos clips editados',
            value: settings.replaySaveToBufferFolder,
            key: 'replaySaveToBufferFolder' as const,
          },
        ].map(({ icon: Icon, label, desc, value, key }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-chibangarx-text-secondary shrink-0" />
              <div>
                <div className="text-sm text-chibangarx-text">{label}</div>
                <div className="text-xs text-chibangarx-text-secondary">{desc}</div>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ [key]: !value } as Partial<typeof settings>)}
              className={`w-10 h-5 rounded-full transition-colors shrink-0 ${value ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${value ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        ))}

        <button
          onClick={() => void replay?.saveReplay()}
          disabled={!replay?.bufferActive || replay?.saving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border border-chibangarx-border text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary disabled:opacity-50"
        >
          <FlaskConical className="w-4 h-4" /> Testar clip agora
        </button>
      </div>
    </div>
  );
}
