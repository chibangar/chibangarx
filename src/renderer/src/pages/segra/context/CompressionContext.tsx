import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface CompressionProgress {
  filePath: string;
  progress: number;
  status: 'compressing' | 'done' | 'error' | 'skipped';
  message?: string;
}

interface CompressionContextType {
  compressionProgress: Record<string, CompressionProgress>;
  isCompressing: (filePath: string) => boolean;
}

const CompressionContext = createContext<CompressionContextType | undefined>(undefined);

export function CompressionProvider({ children }: { children: ReactNode }) {
  const [compressionProgress, setCompressionProgress] = useState<Record<string, CompressionProgress>>({});

  useEffect(() => {
    const listener = (_event: unknown, data: any) => {
      if (data?.method === 'CompressionProgress') {
        const progress = data.content as CompressionProgress;
        if (progress.status === 'done' || progress.status === 'error' || progress.status === 'skipped') {
          setTimeout(() => {
            setCompressionProgress((prev) => { const { [progress.filePath]: _, ...rest } = prev; return rest; });
          }, 2000);
        }
        setCompressionProgress((prev) => ({ ...prev, [progress.filePath]: progress }));
      }
    };
    window.electron.ipcRenderer.on('segra:state-update', listener);
    return () => { window.electron.ipcRenderer.removeListener('segra:state-update', listener); };
  }, []);

  const isCompressing = (filePath: string) => {
    return compressionProgress[filePath]?.status === 'compressing';
  };

  return (
    <CompressionContext.Provider value={{ compressionProgress, isCompressing }}>
      {children}
    </CompressionContext.Provider>
  );
}

export function useCompression() {
  const context = useContext(CompressionContext);
  if (!context) throw new Error('useCompression must be used within a CompressionProvider');
  return context;
}
