import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';
import { RecordingMode } from '../../models/types';
import { Monitor, History, Zap } from 'lucide-react';

const MODES: { id: RecordingMode; label: string; description: string; icon: typeof Monitor; features: string[] }[] = [
  {
    id: 'Hybrid',
    label: 'Híbrido',
    description: 'Sessão + Replay Buffer',
    icon: Zap,
    features: ['Gravação contínua + buffer de 30s', 'Criação de clips a qualquer momento', 'Melhor dos dois mundos'],
  },
  {
    id: 'Session',
    label: 'Sessão',
    description: 'Gravação contínua',
    icon: Monitor,
    features: ['Gravação contínua', ' bookmarks e highlights', 'Ideal para sessões longas'],
  },
  {
    id: 'Buffer',
    label: 'Replay Buffer',
    description: 'Buffer temporizado',
    icon: History,
    features: ['Últimos N segundos', 'Criação de clips sob demanda', 'Economiza espaço'],
  },
];

export default function CaptureModeSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Modo de Gravação</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Escolha como deseja gravar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = settings.recordingMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => updateSettings({ recordingMode: mode.id })}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isActive
                  ? 'border-chibangarx-primary bg-chibangarx-primary/10'
                  : 'border-chibangarx-border hover:border-chibangarx-border-secondary bg-chibangarx-card'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-chibangarx-primary" />
              )}
              <Icon className={`w-6 h-6 mb-3 ${isActive ? 'text-chibangarx-primary' : 'text-chibangarx-text-secondary'}`} />
              <div className="font-medium text-chibangarx-text">{mode.label}</div>
              <div className="text-xs text-chibangarx-text-secondary mt-0.5">{mode.description}</div>
              <ul className="mt-3 space-y-1">
                {mode.features.map((f, i) => (
                  <li key={i} className="text-xs text-chibangarx-text-secondary flex items-center gap-1.5">
                    <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-chibangarx-primary' : 'bg-chibangarx-text-secondary'}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {(settings.recordingMode === 'Buffer' || settings.recordingMode === 'Hybrid') && (
        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl">
          <div>
            <label className="text-sm text-chibangarx-text-secondary">Duração do Buffer (segundos)</label>
            <input
              type="number"
              min={5}
              max={300}
              value={settings.replayBufferDuration}
              onChange={(e) => updateSettings({ replayBufferDuration: Number(e.target.value) })}
              className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
            />
          </div>
          <div>
            <label className="text-sm text-chibangarx-text-secondary">Tamanho Máximo (MB)</label>
            <input
              type="number"
              min={100}
              max={10000}
              value={settings.replayBufferMaxSize}
              onChange={(e) => updateSettings({ replayBufferMaxSize: Number(e.target.value) })}
              className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
