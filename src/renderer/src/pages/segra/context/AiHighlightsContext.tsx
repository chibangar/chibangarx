import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { AiProgress } from '../models/types';

interface AiHighlightsContextType {
  aiProgress: Record<string, AiProgress>;
  removeAiHighlight: (id: string) => void;
}

const AiHighlightsContext = createContext<AiHighlightsContextType | undefined>(undefined);

export function AiHighlightsProvider({ children }: { children: ReactNode }) {
  const [aiProgress, setAiProgress] = useState<Record<string, AiProgress>>({});

  useEffect(() => {
    const listener = (_event: unknown, data: any) => {
      if (data?.method === 'AiProgress') {
        const progress = data.content as AiProgress;
        setAiProgress((prev) => ({ ...prev, [progress.id]: progress }));
        if (progress.status === 'done') {
          setAiProgress((prev) => { const { [progress.id]: _, ...rest } = prev; return rest; });
        } else if (progress.progress < 0) {
          setTimeout(() => {
            setAiProgress((prev) => { const { [progress.id]: _, ...rest } = prev; return rest; });
          }, 5000);
        }
      }
    };
    window.electron.ipcRenderer.on('segra:state-update', listener);
    return () => { window.electron.ipcRenderer.removeListener('segra:state-update', listener); };
  }, []);

  const removeAiHighlight = (id: string) => {
    setAiProgress((prev) => { const { [id]: _, ...rest } = prev; return rest; });
  };

  return (
    <AiHighlightsContext.Provider value={{ aiProgress, removeAiHighlight }}>
      {children}
    </AiHighlightsContext.Provider>
  );
}

export function useAiHighlights() {
  const context = useContext(AiHighlightsContext);
  if (!context) throw new Error('useAiHighlights must be used within an AiHighlightsProvider');
  return context;
}
