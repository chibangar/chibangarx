import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelectedVideo } from './context/SelectedVideoContext';
import { useSegments } from './context/SegmentsContext';
import { BookmarkType, includeInHighlight, Segment } from './models/types';
import { sendMessageToBackend } from './utils/MessageUtils';
import { Play, Pause, SkipBack, SkipForward, Bookmark, Trash2, Plus, Scissors, Crown } from 'lucide-react';
import Button from './components/Button';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTimeHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoEditor() {
  const { selectedVideo, setSelectedVideo } = useSelectedVideo();
  const { segments, addSegment, updateSegment, removeSegment, clearAllSegments } = useSegments();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onEnded = () => setIsPlaying(false);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('ended', onEnded);
    return () => { video.removeEventListener('timeupdate', onTimeUpdate); video.removeEventListener('durationchange', onDurationChange); video.removeEventListener('ended', onEnded); };
  }, [selectedVideo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };

  const seek = (time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const addSegmentAtCurrentTime = () => {
    if (!selectedVideo || duration === 0) return;
    const startTime = Math.max(0, currentTime - 5);
    const endTime = Math.min(duration, currentTime + 5);
    const newSegment: Segment = {
      id: Date.now(),
      contentId: selectedVideo.id,
      type: selectedVideo.type,
      startTime,
      endTime,
      isLoading: false,
      fileName: selectedVideo.fileName,
      filePath: selectedVideo.filePath,
      game: selectedVideo.game,
      title: selectedVideo.title,
    };
    addSegment(newSegment);
  };

  const createClip = () => {
    if (!selectedVideo || segments.length === 0) return;
    sendMessageToBackend('CreateClip', {
      contentId: selectedVideo.id,
      filePath: selectedVideo.filePath,
      segments: segments.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
    });
  };

  const createHighlight = () => {
    if (!selectedVideo) return;
    const highlightBookmarks = selectedVideo.bookmarks.filter((bm) => includeInHighlight(bm.type));
    if (highlightBookmarks.length === 0) return;
    sendMessageToBackend('CreateHighlight', {
      contentId: selectedVideo.id,
      filePath: selectedVideo.filePath,
      bookmarks: highlightBookmarks,
    });
  };

  const addBookmark = () => {
    if (!selectedVideo) return;
    sendMessageToBackend('CreateBookmark', {
      contentId: selectedVideo.id,
      time: formatTimeHMS(currentTime),
      type: BookmarkType.Manual,
    });
  };

  const contentUrl = selectedVideo ? `file://${selectedVideo.filePath}` : '';

  const timelineWidth = duration > 0 ? Math.max(100, (duration / 60) * 100 * zoom) : 100;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="p-5 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-chibangarx-text">{selectedVideo?.title || selectedVideo?.game || 'Video Editor'}</h1>
          <p className="text-sm text-chibangarx-text-secondary">{selectedVideo?.fileName}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setSelectedVideo(null)}>Back to list</Button>
      </div>

      <div className="bg-chibangarx-card border border-chibangarx-border rounded-xl overflow-hidden">
        <video ref={videoRef} className="w-full max-h-[500px] bg-black" src={contentUrl} controls={false} />
      </div>

      <div className="bg-chibangarx-card border border-chibangarx-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => seek(Math.max(0, currentTime - 5))}><SkipBack size={16} /></Button>
          <Button variant="primary" size="sm" onClick={togglePlay}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => seek(Math.min(duration, currentTime + 5))}><SkipForward size={16} /></Button>
          <span className="text-sm text-chibangarx-text-secondary ml-2">{formatTimeHMS(currentTime)} / {formatTimeHMS(duration)}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-chibangarx-text-secondary">Zoom:</span>
            <input type="range" min="0.5" max="5" step="0.5" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-24 accent-chibangarx-primary" />
          </div>
        </div>

        <div ref={timelineRef} className="relative h-12 bg-chibangarx-bg rounded-lg overflow-x-auto overflow-y-hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
          const time = (x / timelineWidth) * duration;
          seek(Math.max(0, Math.min(duration, time)));
        }}>
          <div className="absolute top-0 left-0 h-full" style={{ width: `${timelineWidth}px` }}>
            <div className="absolute top-0 left-0 h-full bg-chibangarx-primary/20" style={{ width: `${progressPercent}%` }} />
            {selectedVideo?.bookmarks.map((bm) => {
              const pos = (parseFloat(bm.time) / duration) * 100;
              return (
                <div key={bm.id} className={`absolute top-0 h-full w-0.5 ${
                  bm.type === BookmarkType.Kill ? 'bg-red-500' :
                  bm.type === BookmarkType.Death ? 'bg-gray-400' :
                  bm.type === BookmarkType.Goal ? 'bg-green-500' : 'bg-yellow-500'
                }`} style={{ left: `${pos}%` }} title={`${bm.type} - ${formatTime(parseFloat(bm.time))}`} />
              );
            })}
            {segments.map((seg) => {
              const left = (seg.startTime / duration) * 100;
              const width = ((seg.endTime - seg.startTime) / duration) * 100;
              return (
                <div key={seg.id} className="absolute top-1 h-10 bg-chibangarx-primary/30 border border-chibangarx-primary rounded cursor-pointer hover:bg-chibangarx-primary/50 transition-colors"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  onClick={(e) => { e.stopPropagation(); seek(seg.startTime); }}
                >
                  <button className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center text-[10px] hover:bg-red-400"
                    onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }}
                  >x</button>
                </div>
              );
            })}
            <div className="absolute top-0 w-0.5 h-full bg-chibangarx-primary" style={{ left: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={addSegmentAtCurrentTime}><Plus size={14} className="mr-1" />Add Segment</Button>
          <Button variant="primary" size="sm" onClick={addBookmark}><Bookmark size={14} className="mr-1" />Bookmark</Button>
          <Button variant="primary" size="sm" onClick={createClip} disabled={segments.length === 0}><Scissors size={14} className="mr-1" />Create Clip ({segments.length} segments)</Button>
          <Button variant="primary" size="sm" onClick={createHighlight} disabled={!selectedVideo?.bookmarks.some((bm) => includeInHighlight(bm.type))}>
            <Crown size={14} className="mr-1" />Create Highlight
          </Button>
          {segments.length > 0 && <Button variant="danger" size="sm" onClick={clearAllSegments}><Trash2 size={14} className="mr-1" />Clear Segments</Button>}
        </div>
      </div>

      {segments.length > 0 && (
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-chibangarx-text mb-3">Segments ({segments.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {segments.map((seg) => (
              <div key={seg.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-chibangarx-bg border border-chibangarx-border">
                <span className="text-chibangarx-text-secondary font-mono text-xs">
                  {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                </span>
                <button className="text-red-400 hover:text-red-300" onClick={() => removeSegment(seg.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedVideo && selectedVideo.bookmarks.length > 0 && (
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-chibangarx-text mb-3">Bookmarks ({selectedVideo.bookmarks.length})</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {selectedVideo.bookmarks.map((bm) => (
              <div key={bm.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-chibangarx-bg">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    bm.type === BookmarkType.Kill ? 'bg-red-500' :
                    bm.type === BookmarkType.Death ? 'bg-gray-400' :
                    bm.type === BookmarkType.Goal ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-chibangarx-text-secondary">{formatTime(parseFloat(bm.time))}</span>
                  <span className="text-chibangarx-text">{bm.type}</span>
                </div>
                <button className="text-red-500 hover:text-red-400" onClick={() => sendMessageToBackend('DeleteBookmark', { contentId: selectedVideo.id, bookmarkId: bm.id })}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
