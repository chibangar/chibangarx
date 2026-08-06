import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';

const CLIP_QUALITY_PRESETS = [
  { id: 'low' as const, label: 'Baixa', desc: 'Rápido, ficheiro pequeno' },
  { id: 'standard' as const, label: 'Padrão', desc: 'Equilíbrio qualidade/tamanho' },
  { id: 'high' as const, label: 'Alta', desc: 'Máxima qualidade' },
  { id: 'custom' as const, label: 'Personalizado', desc: 'Configurar manualmente' },
];

const CODECS = ['h264', 'h265', 'av1'] as const;
const FPS_OPTIONS = [0, 24, 30, 60, 120, 144];
const AUDIO_QUALITY = ['96k', '128k', '192k', '256k', '320k'] as const;

const CPU_PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'];
const NVIDIA_PRESETS = ['slow', 'medium', 'fast', 'hp', 'hq', 'bd', 'll', 'llhq', 'llhp', 'lossless', 'losslesshp'];
const AMD_PRESETS = ['quality', 'transcoding', 'lowlatency', 'ultralowlatency'];
const INTEL_PRESETS = ['fast', 'medium', 'slow'];

export default function ClipSettingsSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();

  const isCustom = settings.clipQualityPreset === 'custom';
  const isGpu = settings.clipEncoder === 'gpu';

  const getPresets = () => {
    if (!isGpu) return CPU_PRESETS;
    if (settings.clipCodec === 'av1') return NVIDIA_PRESETS;
    return NVIDIA_PRESETS;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Configurações de Clips</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Qualidade ao criar clips a partir de sessões</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CLIP_QUALITY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => updateSettings({ clipQualityPreset: preset.id })}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              settings.clipQualityPreset === preset.id
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
              <label className="text-sm text-chibangarx-text-secondary">Encoder</label>
              <select
                value={settings.clipEncoder}
                onChange={(e) => updateSettings({ clipEncoder: e.target.value as 'gpu' | 'cpu' })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                <option value="gpu">GPU (NVENC/AMF)</option>
                <option value="cpu">CPU (x264)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-chibangarx-text-secondary">Codec</label>
              <select
                value={settings.clipCodec}
                onChange={(e) => updateSettings({ clipCodec: e.target.value as any })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                {CODECS.map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-chibangarx-text-secondary">FPS</label>
              <select
                value={settings.clipFps}
                onChange={(e) => updateSettings({ clipFps: Number(e.target.value) as any })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                {FPS_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f === 0 ? 'Original' : f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-chibangarx-text-secondary">Áudio</label>
              <select
                value={settings.clipAudioQuality}
                onChange={(e) => updateSettings({ clipAudioQuality: e.target.value as any })}
                className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
              >
                {AUDIO_QUALITY.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-chibangarx-text-secondary">Preset</label>
            <select
              value={settings.clipPreset}
              onChange={(e) => updateSettings({ clipPreset: e.target.value as any })}
              className="mt-1 w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
            >
              {getPresets().map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-chibangarx-text-secondary">
              {isGpu ? 'Qualidade (CQ)' : 'CRF'}: {isGpu ? settings.clipQualityGpu : settings.clipQualityCpu}
            </label>
            <input
              type="range"
              min={0}
              max={51}
              value={isGpu ? settings.clipQualityGpu : settings.clipQualityCpu}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateSettings(isGpu ? { clipQualityGpu: val } : { clipQualityCpu: val });
              }}
              className="mt-1 w-full accent-chibangarx-primary"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl">
        <div>
          <span className="text-sm text-chibangarx-text">Manter Faixas de Áudio Separadas</span>
          <p className="text-xs text-chibangarx-text-secondary mt-0.5">Guarda cada pista de áudio num ficheiro separado</p>
        </div>
        <button
          onClick={() => updateSettings({ clipKeepSeparateAudioTracks: !settings.clipKeepSeparateAudioTracks })}
          className={`w-10 h-5 rounded-full transition-colors ${settings.clipKeepSeparateAudioTracks ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.clipKeepSeparateAudioTracks ? 'translate-x-5' : ''}`} />
        </button>
      </div>
    </div>
  );
}
