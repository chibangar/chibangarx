import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';

export default function HighlightsSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Destaques AI</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Geração automática de melhores momentos</p>
      </div>

      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-chibangarx-text">Ativar Destaques</span>
            <p className="text-xs text-chibangarx-text-secondary mt-0.5">Análise AI de momentos importantes</p>
          </div>
          <button
            onClick={() => updateSettings({ enableAi: !settings.enableAi })}
            className={`w-10 h-5 rounded-full transition-colors ${settings.enableAi ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.enableAi ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {settings.enableAi && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-chibangarx-text">Auto-Gerar Após Gravação</span>
                <p className="text-xs text-chibangarx-text-secondary mt-0.5">Processa automaticamente ao parar gravação</p>
              </div>
              <button
                onClick={() => updateSettings({ autoGenerateHighlights: !settings.autoGenerateHighlights })}
                className={`w-10 h-5 rounded-full transition-colors ${settings.autoGenerateHighlights ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.autoGenerateHighlights ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div>
              <label className="text-sm text-chibangarx-text-secondary">Segundos Antes do Destaque: {settings.highlightPaddingBefore}s</label>
              <input
                type="range"
                min={1}
                max={60}
                value={settings.highlightPaddingBefore}
                onChange={(e) => updateSettings({ highlightPaddingBefore: Number(e.target.value) })}
                className="mt-1 w-full accent-chibangarx-primary"
              />
            </div>

            <div>
              <label className="text-sm text-chibangarx-text-secondary">Segundos Após o Destaque: {settings.highlightPaddingAfter}s</label>
              <input
                type="range"
                min={1}
                max={60}
                value={settings.highlightPaddingAfter}
                onChange={(e) => updateSettings({ highlightPaddingAfter: Number(e.target.value) })}
                className="mt-1 w-full accent-chibangarx-primary"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
