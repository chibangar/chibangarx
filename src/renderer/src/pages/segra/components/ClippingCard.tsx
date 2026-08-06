import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ClippingProgress } from '../context/ClippingContext';

interface ClippingCardProps {
  clipping: ClippingProgress;
  onCancel: (id: number) => void;
}

const ClippingCard: React.FC<ClippingCardProps> = ({ clipping, onCancel }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (clipping.progress > 95) { setDisplayProgress(clipping.progress); return; }
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        const diff = clipping.progress - prev;
        if (Math.abs(diff) < 0.1) return clipping.progress;
        return prev + diff * 0.15;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [clipping.progress]);

  const handleCancel = () => { setIsCancelling(true); onCancel(clipping.id); };
  const isError = clipping.progress === -1;

  return (
    <div className="w-full px-2">
      <div className={`bg-chibangarx-card border rounded-lg p-3 ${isError ? 'border-red-500' : 'border-chibangarx-border'}`}>
        <div className="flex items-center gap-3 w-full relative">
          {isError ? (
            <div className="w-5 h-5 rounded-full bg-red-500" />
          ) : clipping.progress < 100 ? (
            <div className="w-5 h-5 rounded-full border-2 border-chibangarx-primary border-t-transparent animate-spin" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-green-500" />
          )}
          <div className="min-w-0 flex-1">
            {clipping.progress >= 0 && clipping.progress < 100 && (
              <button onClick={handleCancel} disabled={isCancelling} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 transition-colors cursor-pointer disabled:opacity-50">
                <X size={16} />
              </button>
            )}
            <div className={`text-sm font-medium truncate ${isError ? 'text-red-400' : 'text-chibangarx-text'}`}>
              {isError ? 'Clip Failed' : 'Creating Clip'}
            </div>
            <div className={`text-xs truncate ${isError ? 'text-red-400/70' : 'text-chibangarx-text-secondary'}`}>
              {isError ? clipping.error || 'Unknown error' : `${Math.round(displayProgress)}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClippingCard;
