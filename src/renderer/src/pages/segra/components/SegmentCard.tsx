import React, { useRef } from 'react';
import { SegmentCardProps } from '../models/types';
import { Trash2 } from 'lucide-react';

const SegmentCard: React.FC<SegmentCardProps> = React.memo(({
  segment, index, formatTime, isHovered, setHoveredSegmentId, removeSegment,
}) => {
  const { startTime, endTime, thumbnailDataUrl, isLoading } = segment;

  return (
    <div
      className={`mb-2 w-full relative rounded-xl transition-all duration-200 border ${
        isHovered ? 'border-chibangarx-primary' : 'border-chibangarx-border'
      }`}
      onMouseEnter={() => setHoveredSegmentId(segment.id)}
      onMouseLeave={() => setHoveredSegmentId(null)}
    >
      {thumbnailDataUrl ? (
        <figure className="relative rounded-xl overflow-hidden">
          <img src={thumbnailDataUrl} alt="Segment" className="w-full" />
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {formatTime(startTime)} - {formatTime(endTime)}
          </div>
          <button
            className="absolute top-2 right-2 p-1 bg-black/75 text-white rounded hover:bg-red-500/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); removeSegment(segment.id); }}
          >
            <Trash2 size={14} />
          </button>
        </figure>
      ) : isLoading || thumbnailDataUrl ? (
        <div className="relative w-full aspect-video rounded-xl bg-chibangarx-bg">
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {formatTime(startTime)} - {formatTime(endTime)}
          </div>
          <button
            className="absolute top-2 right-2 p-1 bg-black/75 text-white rounded hover:bg-red-500/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); removeSegment(segment.id); }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <div className="h-32 bg-chibangarx-border-secondary flex items-center justify-center text-chibangarx-text-secondary rounded-xl">
          <span>No thumbnail</span>
        </div>
      )}
    </div>
  );
});

export default SegmentCard;
