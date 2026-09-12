import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';
import { useAppState } from '../../context/AppStateContext';
import { Mic, Volume2 } from 'lucide-react';

export default function AudioDevicesSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();
  const appState = useAppState();

  const toggleInputDevice = (deviceId: string) => {
    const exists = settings.inputDevices.find(d => d.id === deviceId);
    if (exists) {
      updateSettings({ inputDevices: settings.inputDevices.filter(d => d.id !== deviceId) });
    } else {
      const device = appState.inputDevices.find(d => d.id === deviceId);
      if (device) {
        updateSettings({ inputDevices: [...settings.inputDevices, { id: device.id, name: device.name, volume: 100 }] });
      }
    }
  };

  const toggleOutputDevice = (deviceId: string) => {
    const exists = settings.outputDevices.find(d => d.id === deviceId);
    if (exists) {
      updateSettings({ outputDevices: settings.outputDevices.filter(d => d.id !== deviceId) });
    } else {
      const device = appState.outputDevices.find(d => d.id === deviceId);
      if (device) {
        updateSettings({ outputDevices: [...settings.outputDevices, { id: device.id, name: device.name, volume: 100 }] });
      }
    }
  };

  const updateInputVolume = (deviceId: string, volume: number) => {
    updateSettings({
      inputDevices: settings.inputDevices.map(d => d.id === deviceId ? { ...d, volume } : d),
    });
  };

  const updateOutputVolume = (deviceId: string, volume: number) => {
    updateSettings({
      outputDevices: settings.outputDevices.map(d => d.id === deviceId ? { ...d, volume } : d),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Dispositivos de Áudio</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Selecione microfones e saídas de áudio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-chibangarx-primary" />
            <span className="text-sm font-medium text-chibangarx-text">Entrada (Microfone)</span>
          </div>
          {appState.inputDevices.length === 0 ? (
            <p className="text-xs text-chibangarx-text-secondary">Nenhum dispositivo encontrado</p>
          ) : (
            appState.inputDevices.map((device) => {
              const isSelected = settings.inputDevices.some(d => d.id === device.id);
              const deviceSetting = settings.inputDevices.find(d => d.id === device.id);
              return (
                <div key={device.id} className="space-y-2">
                  <div
                    onClick={() => toggleInputDevice(device.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'bg-chibangarx-primary/10 border border-chibangarx-primary/30' : 'border border-transparent hover:bg-chibangarx-border-secondary'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`} />
                    <span className="text-sm text-chibangarx-text truncate">{device.name}</span>
                    {device.isDefault && <span className="text-xs text-chibangarx-text-secondary ml-auto">Padrão</span>}
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-2 px-2">
                      <Volume2 className="w-3 h-3 text-chibangarx-text-secondary" />
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={deviceSetting?.volume ?? 100}
                        onChange={(e) => updateInputVolume(device.id, Number(e.target.value))}
                        className="flex-1 accent-chibangarx-primary"
                      />
                      <span className="text-xs text-chibangarx-text-secondary w-8 text-right">{deviceSetting?.volume ?? 100}%</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-chibangarx-primary" />
            <span className="text-sm font-medium text-chibangarx-text">Saída (Áudio do Sistema)</span>
          </div>
          {appState.outputDevices.length === 0 ? (
            <p className="text-xs text-chibangarx-text-secondary">Nenhum dispositivo encontrado</p>
          ) : (
            appState.outputDevices.map((device) => {
              const isSelected = settings.outputDevices.some(d => d.id === device.id);
              const deviceSetting = settings.outputDevices.find(d => d.id === device.id);
              return (
                <div key={device.id} className="space-y-2">
                  <div
                    onClick={() => toggleOutputDevice(device.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'bg-chibangarx-primary/10 border border-chibangarx-primary/30' : 'border border-transparent hover:bg-chibangarx-border-secondary'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`} />
                    <span className="text-sm text-chibangarx-text truncate">{device.name}</span>
                    {device.isDefault && <span className="text-xs text-chibangarx-text-secondary ml-auto">Padrão</span>}
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-2 px-2">
                      <Volume2 className="w-3 h-3 text-chibangarx-text-secondary" />
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={deviceSetting?.volume ?? 100}
                        onChange={(e) => updateOutputVolume(device.id, Number(e.target.value))}
                        className="flex-1 accent-chibangarx-primary"
                      />
                      <span className="text-xs text-chibangarx-text-secondary w-8 text-right">{deviceSetting?.volume ?? 100}%</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-chibangarx-text">Supressão de Ruído</span>
          <button
            onClick={() => updateSettings({ inputNoiseSuppression: !settings.inputNoiseSuppression })}
            className={`w-10 h-5 rounded-full transition-colors ${settings.inputNoiseSuppression ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.inputNoiseSuppression ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-chibangarx-text">Forçar Mono nas Entradas</span>
          <button
            onClick={() => updateSettings({ forceMonoInputSources: !settings.forceMonoInputSources })}
            className={`w-10 h-5 rounded-full transition-colors ${settings.forceMonoInputSources ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.forceMonoInputSources ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-chibangarx-text">Pistas de Áudio Separadas</span>
          <button
            onClick={() => updateSettings({ enableSeparateAudioTracks: !settings.enableSeparateAudioTracks })}
            className={`w-10 h-5 rounded-full transition-colors ${settings.enableSeparateAudioTracks ? 'bg-chibangarx-primary' : 'bg-chibangarx-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.enableSeparateAudioTracks ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
