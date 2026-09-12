import { useState } from 'react';
import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';
import { invoke } from '@/lib/electron';
import { FileText, Plane, Info } from 'lucide-react';

export default function AdvancedSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();
  const [version, setVersion] = useState('');

  const getVersion = async () => {
    const v = await invoke<string>({ channel: 'app:getVersion' });
    if (v) setVersion(v);
  };

  useState(() => { getVersion(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Avançado</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Configurações avançadas e informação da app</p>
      </div>

      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-chibangarx-text">Receber Atualizações Beta</span>
            <p className="text-xs text-chibangarx-text-secondary">Receber versões de teste antes do lançamento oficial</p>
          </div>
          <button
            onClick={() => updateSettings({ receiveBetaUpdates: !settings.receiveBetaUpdates })}
            className={`w-10 h-5 rounded-full transition-colors ${settings.receiveBetaUpdates ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.receiveBetaUpdates ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-chibangarx-text">Modo Avião</span>
            <p className="text-xs text-chibangarx-text-secondary">Desativar todas as ligações de rede</p>
          </div>
          <button
            onClick={() => updateSettings({ airplaneMode: !settings.airplaneMode })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              settings.airplaneMode ? 'bg-chibangarx-primary/20 text-chibangarx-primary' : 'bg-chibangarx-border-secondary text-chibangarx-text-secondary'
            }`}
          >
            <Plane className={`w-4 h-4 ${settings.airplaneMode ? 'fill-chibangarx-primary' : ''}`} />
            {settings.airplaneMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
        <button
          onClick={() => sendMessageToBackend('openLogFile')}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-chibangarx-border-secondary transition-colors text-left"
        >
          <FileText className="w-5 h-5 text-chibangarx-text-secondary" />
          <div>
            <div className="text-sm text-chibangarx-text">Ver Logs</div>
            <div className="text-xs text-chibangarx-text-secondary">Abrir ficheiro de registo</div>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 py-4 text-chibangarx-text-secondary">
        <Info className="w-4 h-4" />
        <span className="text-sm">ChibangaRx v{version}</span>
      </div>
    </div>
  );
}
