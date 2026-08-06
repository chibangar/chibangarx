import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Settings, initialSettings } from '../models/types';
import { sendMessageToBackend } from '../utils/MessageUtils';
import { invoke } from '@/lib/electron';

type SettingsContextType = Settings;
type SettingsUpdateContextType = (newSettings: Partial<Settings>, fromBackend?: boolean) => void;

const SettingsContext = createContext<SettingsContextType>(initialSettings);
const SettingsUpdateContext = createContext<SettingsUpdateContextType>(() => {});

export function useSettings(): SettingsContextType {
  return useContext(SettingsContext);
}

export function useSettingsUpdater(): SettingsUpdateContextType {
  return useContext(SettingsUpdateContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  const updateSettings = useCallback<SettingsUpdateContextType>(
    (newSettings, fromBackend = false) => {
      setSettings((prev) => {
        const updatedSettings: Settings = { ...prev, ...newSettings };
        if (!fromBackend) {
          sendMessageToBackend('UpdateSettings', updatedSettings);
        }
        return updatedSettings;
      });
    },
    [],
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await invoke({ channel: 'segra:get-settings' }) as Settings | null;
        if (saved) setSettings({ ...initialSettings, ...saved });
      } catch (err) {
        console.error('[Segra] Failed to load settings:', err);
      }
    };
    loadSettings();

    const listener = (_event: unknown, data: any) => {
      if (data?.method === 'Settings') {
        updateSettings(data.content, true);
      }
    };
    window.electron.ipcRenderer.on('segra:state-update', listener);
    return () => {
      window.electron.ipcRenderer.removeListener('segra:state-update', listener);
    };
  }, [updateSettings]);

  return (
    <SettingsContext.Provider value={settings}>
      <SettingsUpdateContext.Provider value={updateSettings}>
        {children}
      </SettingsUpdateContext.Provider>
    </SettingsContext.Provider>
  );
}
