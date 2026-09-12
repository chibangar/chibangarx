import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { State, initialState, GameListEntry, Content } from '../models/types';
import { invoke } from '@/lib/electron';

const AppStateContext = createContext<State>(initialState);
type PatchContent = (id: string, patch: Partial<Content>) => void;
const AppStateUpdaterContext = createContext<PatchContent>(() => {});

export function useAppState(): State {
  return useContext(AppStateContext);
}

export function usePatchContent(): PatchContent {
  return useContext(AppStateUpdaterContext);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<State>(initialState);

  const patchContent = useCallback<PatchContent>((id, patch) => {
    setAppState((prev) => ({
      ...prev,
      content: prev.content.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const state = await invoke({ channel: 'segra:get-state' }) as State;
        if (state) setAppState((prev) => ({ ...prev, ...state }));
      } catch (err) {
        console.error('[Segra] Failed to load state:', err);
      }
    };
    loadData();

    const listener = (_event: unknown, data: any) => {
      if (data?.method === 'State') {
        setAppState((prev) => ({ ...prev, ...data.content }));
      } else if (data?.method === 'GameList') {
        setAppState((prev) => ({ ...prev, gameList: data.content as GameListEntry[] }));
      }
    };
    window.electron.ipcRenderer.on('segra:state-update', listener);
    return () => {
      window.electron.ipcRenderer.removeListener('segra:state-update', listener);
    };
  }, []);

  return (
    <AppStateContext.Provider value={appState}>
      <AppStateUpdaterContext.Provider value={patchContent}>
        {children}
      </AppStateUpdaterContext.Provider>
    </AppStateContext.Provider>
  );
}
