import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { sendMessageToBackend } from '../utils/MessageUtils';
import { useSegments } from './SegmentsContext';
import { useSettings } from './SettingsContext';
import { Segment } from '../models/types';
import { invoke } from '@/lib/electron';

export interface ClippingProgress {
  id: number;
  progress: number;
  segments: Segment[];
  error?: string;
}

export interface ClippingContextType {
  clippingProgress: Record<number, ClippingProgress>;
  removeClipping: (id: number) => void;
  cancelClip: (id: number) => void;
}

export const ClippingContext = createContext<ClippingContextType | undefined>(undefined);

export function ClippingProvider({ children }: { children: ReactNode }) {
  const [clippingProgress, setClippingProgress] = useState<Record<number, ClippingProgress>>({});
  const suppressedIds = useRef<Set<number>>(new Set());
  const { removeSegment } = useSegments();
  const settings = useSettings();

  useEffect(() => {
    const listener = (_event: unknown, data: any) => {
      if (data?.method === 'ClipProgress') {
        const progress = data.content as ClippingProgress;
        if (suppressedIds.current.has(progress.id)) return;
        setClippingProgress((prev) => ({ ...prev, [progress.id]: progress }));
        if (progress.progress === 100) {
          if (settings.clipClearSegmentsAfterCreatingClip && progress.segments?.length > 0) {
            progress.segments.forEach((segment) => removeSegment(segment.id));
          }
          setClippingProgress((prev) => { const { [progress.id]: _, ...rest } = prev; return rest; });
        } else if (progress.progress === -1) {
          console.error('Clip creation failed:', progress.error);
          setTimeout(() => {
            setClippingProgress((prev) => { const { [progress.id]: _, ...rest } = prev; return rest; });
          }, 5000);
        }
      }
    };
    window.electron.ipcRenderer.on('segra:state-update', listener);
    return () => { window.electron.ipcRenderer.removeListener('segra:state-update', listener); };
  }, [settings.clipClearSegmentsAfterCreatingClip, removeSegment]);

  const removeClipping = (id: number) => {
    setClippingProgress((prev) => { const { [id]: _, ...rest } = prev; return rest; });
  };

  const cancelClip = (id: number) => {
    suppressedIds.current.add(id);
    sendMessageToBackend('CancelClip', { id });
    setClippingProgress((prev) => { const { [id]: _, ...rest } = prev; return rest; });
  };

  return (
    <ClippingContext.Provider value={{ clippingProgress, removeClipping, cancelClip }}>
      {children}
    </ClippingContext.Provider>
  );
}

export function useClipping() {
  const context = useContext(ClippingContext);
  if (!context) throw new Error('useClipping must be used within a ClippingProvider');
  return context;
}
