import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';

export default function PreferencesSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();

  const toggles = [
    { key: 'runOnStartup' as const, label: 'Iniciar com o Sistema', desc: 'Abrir automaticamente ao ligar o PC' },
    { key: 'showGameBackground' as const, label: 'Mostrar Capa do Jogo', desc: 'Exibir imagem de fundo do jogo' },
    { key: 'showAudioWaveformInTimeline' as const, label: 'Mostrar Forma de Onda', desc: 'Exibir áudio na linha do tempo' },
    { key: 'confirmBeforeDeleting' as const, label: 'Confirmar Antes de Apagar', desc: 'Pedir confirmação ao eliminar conteúdo' },
    { key: 'removeOriginalAfterCompression' as const, label: 'Apagar Original Após Comprimir', desc: 'Remover ficheiro original' },
    { key: 'discardSessionsWithoutBookmarks' as const, label: 'Descartar Sessões Sem Bookmarks', desc: 'Eliminar sessões sem bookmarks guardados' },
    { key: 'showNewBadgeOnVideos' as const, label: 'Mostrar Badge NOVO', desc: 'Exibir indicador em conteúdo recente' },
    { key: 'clipClearSegmentsAfterCreatingClip' as const, label: 'Limpar Segmentos Após Clip', desc: 'Remover segmentos ao criar clip' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Preferências</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Comportamento da aplicação</p>
      </div>

      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
        {toggles.map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between py-1">
            <div>
              <span className="text-sm text-chibangarx-text">{toggle.label}</span>
              <p className="text-xs text-chibangarx-text-secondary">{toggle.desc}</p>
            </div>
            <button
              onClick={() => updateSettings({ [toggle.key]: !settings[toggle.key] })}
              className={`w-10 h-5 rounded-full transition-colors shrink-0 ml-4 ${settings[toggle.key] ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings[toggle.key] ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
        <div>
          <label className="text-sm text-chibangarx-text-secondary">Ação ao Fechar</label>
          <div className="flex gap-2 mt-2">
            {(['Minimize', 'Exit'] as const).map((action) => (
              <button
                key={action}
                onClick={() => updateSettings({ closeButtonAction: action })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  settings.closeButtonAction === action
                    ? 'border-chibangarx-primary bg-chibangarx-primary/10 text-chibangarx-primary'
                    : 'border-chibangarx-border text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary'
                }`}
              >
                {action === 'Minimize' ? 'Minimizar' : 'Sair'}
              </button>
            ))}
          </div>
        </div>

        {settings.runOnStartup && (
          <div>
            <label className="text-sm text-chibangarx-text-secondary">Modo de Início</label>
            <div className="flex gap-2 mt-2">
              {(['Minimized', 'Normal'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ startupWindowMode: mode })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    settings.startupWindowMode === mode
                      ? 'border-chibangarx-primary bg-chibangarx-primary/10 text-chibangarx-primary'
                      : 'border-chibangarx-border text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary'
                  }`}
                >
                  {mode === 'Minimized' ? 'Minimizado' : 'Normal'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-chibangarx-text-secondary">Volume dos Efeitos Sonoros: {Math.round(settings.soundEffectsVolume * 100)}%</label>
          <input
            type="range"
            min={0}
            max={200}
            value={settings.soundEffectsVolume * 100}
            onChange={(e) => updateSettings({ soundEffectsVolume: Number(e.target.value) / 100 })}
            className="mt-1 w-full accent-chibangarx-primary"
          />
        </div>
      </div>
    </div>
  );
}
