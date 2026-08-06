import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';
import { useAppState } from '../../context/AppStateContext';

const RESOLUTIONS = ['720p', '1080p', '1440p', '4K'] as const;
const FRAME_RATES = [30, 60, 120, 144];
const RATE_CONTROLS = ['CBR', 'VBR', 'CRF', 'CQP'];

const QUALITY_PRESETS = [
  { id: 'low' as const, label: 'Baixa', desc: '720p / 30fps' },
  { id: 'standard' as const, label: 'Padrão', desc: '1080p / 60fps' },
  { id: 'high' as const, label: 'Alta', desc: '1440p / 60fps' },
  { id: 'custom' as const, label: 'Personalizado', desc: 'Configurar manualmente' },
];

export default function VideoSettingsSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();
  const appState = useAppState();

  const isCustom = settings.videoQualityPreset === 'custom';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Configurações de Vídeo</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Qualidade e formato da gravação</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUALITY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => updateSettings({ videoQualityPreset: preset.id })}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              settings.videoQualityPreset === preset.id
                ? 'border-chibangarx-primary bg-chibangarx-primary/10'
                : 'border-chibangarx-border hover:border-chibangarx-border-secondary'
            }`}
          >
            <div className="font-medium text-sm text-chibangarx-text">{preset.label}</div>
            <div className="text-xs text-chibangarx-text-secondary mt-0.5">{preset.desc}</div>
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-chibangarx-text-secondary">Resolução</label>
              <select
                value={settings.resolution}
                onChange={(e) => updateSettings({ resolution: e.target.value as any })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                {RESOLUTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-chibangarx-text-secondary">FPS</label>
              <select
                value={settings.frameRate}
                onChange={(e) => updateSettings({ frameRate: Number(e.target.value) })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                {FRAME_RATES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-chibangarx-text-secondary">Controle de Taxa</label>
              <select
                value={settings.rateControl}
                onChange={(e) => updateSettings({ rateControl: e.target.value })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                {RATE_CONTROLS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-chibangarx-text-secondary">Encoder</label>
              <select
                value={settings.encoder}
                onChange={(e) => updateSettings({ encoder: e.target.value as 'gpu' | 'cpu' })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                <option value="gpu">GPU (NVENC/AMF)</option>
                <option value="cpu">CPU (x264)</option>
              </select>
            </div>
          </div>

          {(settings.rateControl === 'CBR' || settings.rateControl === 'VBR') && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-chibangarx-text-secondary">Bitrate (Mbps)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={settings.bitrate}
                  onChange={(e) => updateSettings({ bitrate: Number(e.target.value) })}
                  className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
                />
              </div>
              {settings.rateControl === 'VBR' && (
                <>
                  <div>
                    <label className="text-sm text-chibangarx-text-secondary">Bitrate Mín (Mbps)</label>
                    <input
                      type="number"
                      min={1}
                      value={settings.minBitrate}
                      onChange={(e) => updateSettings({ minBitrate: Number(e.target.value) })}
                      className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-chibangarx-text-secondary">Bitrate Máx (Mbps)</label>
                    <input
                      type="number"
                      min={1}
                      value={settings.maxBitrate}
                      onChange={(e) => updateSettings({ maxBitrate: Number(e.target.value) })}
                      className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {settings.rateControl === 'CRF' && (
            <div>
              <label className="text-sm text-chibangarx-text-secondary">Valor CRF (0-51)</label>
              <input
                type="range"
                min={0}
                max={51}
                value={settings.crfValue}
                onChange={(e) => updateSettings({ crfValue: Number(e.target.value) })}
                className="mt-1 w-full accent-chibangarx-primary"
              />
              <div className="text-xs text-chibangarx-text-secondary mt-1">{settings.crfValue} — {settings.crfValue < 18 ? 'Qualidade quase sem perda' : settings.crfValue < 23 ? 'Boa qualidade' : settings.crfValue < 28 ? 'Qualidade aceitável' : 'Baixa qualidade'}</div>
            </div>
          )}

          {settings.rateControl === 'CQP' && (
            <div>
              <label className="text-sm text-chibangarx-text-secondary">Nível CQ (0-51)</label>
              <input
                type="range"
                min={0}
                max={51}
                value={settings.cqLevel}
                onChange={(e) => updateSettings({ cqLevel: Number(e.target.value) })}
                className="mt-1 w-full accent-chibangarx-primary"
              />
              <div className="text-xs text-chibangarx-text-secondary mt-1">{settings.cqLevel}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl">
          <label className="text-sm text-chibangarx-text-secondary">Ecrã</label>
          <select
            value={settings.selectedDisplay?.deviceId || ''}
            onChange={(e) => {
              const display = appState.displays.find(d => d.deviceId === e.target.value);
              updateSettings({ selectedDisplay: display || null });
            }}
            className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
          >
            <option value="">Automático</option>
            {appState.displays.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.deviceName}{d.isPrimary ? ' (Principal)' : ''}</option>
            ))}
          </select>
        </div>
        <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-chibangarx-text">Esticar 4:3</span>
            <button
              onClick={() => updateSettings({ stretch4By3: !settings.stretch4By3 })}
              className={`w-10 h-5 rounded-full transition-colors ${settings.stretch4By3 ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.stretch4By3 ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-chibangarx-text">HDR</span>
            <button
              onClick={() => updateSettings({ enableHdr: !settings.enableHdr })}
              className={`w-10 h-5 rounded-full transition-colors ${settings.enableHdr ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.enableHdr ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
