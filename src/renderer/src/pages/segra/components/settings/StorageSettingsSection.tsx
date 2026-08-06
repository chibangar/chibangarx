import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';
import { FolderOpen } from 'lucide-react';
import { invoke } from '@/lib/electron';

export default function StorageSettingsSection() {
  const settings = useSettings();
  const updateSettings = useSettingsUpdater();

  const handleBrowse = async (type: 'content' | 'cache') => {
    const result = await invoke<{ canceled: boolean; filePaths: string[] }>({ channel: 'dialog:openDirectory' });
    if (result && !result.canceled && result.filePaths.length > 0) {
      if (type === 'content') {
        updateSettings({ contentFolder: result.filePaths[0] });
      } else {
        updateSettings({ cacheFolder: result.filePaths[0] });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-chibangarx-text">Armazenamento</h3>
        <p className="text-sm text-chibangarx-text-secondary mt-1">Localização e limite de espaço</p>
      </div>

      <div className="p-4 bg-chibangarx-card border border-chibangarx-border rounded-xl space-y-4">
        <div>
          <label className="text-sm text-chibangarx-text-secondary">Pasta de Gravações</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={settings.contentFolder}
              onChange={(e) => updateSettings({ contentFolder: e.target.value })}
              placeholder="Pasta padrão do utilizador"
              className="flex-1 bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
            />
            <button
              onClick={() => handleBrowse('content')}
              className="px-3 py-2 bg-chibangarx-border-secondary rounded-lg hover:bg-chibangarx-border transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-chibangarx-text-secondary" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-chibangarx-text-secondary">Pasta de Cache</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={settings.cacheFolder}
              onChange={(e) => updateSettings({ cacheFolder: e.target.value })}
              placeholder="Pasta padrão do utilizador"
              className="flex-1 bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-sm text-chibangarx-text focus:outline-none focus:border-chibangarx-primary"
            />
            <button
              onClick={() => handleBrowse('cache')}
              className="px-3 py-2 bg-chibangarx-border-secondary rounded-lg hover:bg-chibangarx-border transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-chibangarx-text-secondary" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-chibangarx-text-secondary">Limite de Armazenamento: {settings.storageLimit} GB</label>
          <input
            type="range"
            min={10}
            max={1000}
            value={settings.storageLimit}
            onChange={(e) => updateSettings({ storageLimit: Number(e.target.value) })}
            className="mt-1 w-full accent-chibangarx-primary"
          />
          <div className="flex justify-between text-xs text-chibangarx-text-secondary mt-1">
            <span>10 GB</span>
            <span>1 TB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
