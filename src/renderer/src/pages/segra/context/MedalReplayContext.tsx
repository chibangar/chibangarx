import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useMedalReplay } from '../hooks/useMedalReplay';

type MedalReplayApi = ReturnType<typeof useMedalReplay>;

const MedalReplayContext = createContext<MedalReplayApi | null>(null);

export function useMedalReplayState(): MedalReplayApi {
  const ctx = useContext(MedalReplayContext);
  if (!ctx) throw new Error('useMedalReplayState must be used inside MedalReplayProvider');
  return ctx;
}

export function useMedalReplayOptional(): MedalReplayApi | null {
  return useContext(MedalReplayContext);
}

export function MedalReplayProvider({ children }: { children: ReactNode }) {
  const api = useMedalReplay();
  const value = useMemo(() => api, [api]);
  return <MedalReplayContext.Provider value={value}>{children}</MedalReplayContext.Provider>;
}
