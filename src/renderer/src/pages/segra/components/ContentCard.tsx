import { useMemo, useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAppState, usePatchContent } from '../context/AppStateContext';
import { BookmarkType, Content, includeInHighlight } from '../models/types';
import { sendMessageToBackend } from '../utils/MessageUtils';
import { useModal } from '../context/ModalContext';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import { Upload, FolderOpen, PenLine, Trash2, Link, Check, Ellipsis, Minimize2, Crown, Copy, Bookmark } from 'lucide-react';

type VideoType = 'Session' | 'Buffer' | 'Clip' | 'Highlight';

const knownContentKeys = new Set<string>();
let hasSeededKnownContent = false;
const loadedThumbnailKeys = new Set<string>();

interface ContentCardProps {
  content?: Content;
  type: VideoType;
  onClick?: (video: Content) => void;
  isLoading?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  isHighlighted?: boolean;
}

export default function ContentCard({
  content, type, onClick, isLoading, isSelected = false, isSelectionMode = false, isHighlighted = false,
}: ContentCardProps) {
  const { enableAi, showNewBadgeOnVideos } = useSettings();
  const { cacheFolder, content: allContent } = useAppState();
  const patchContent = usePatchContent();
  const { openModal, closeModal } = useModal();
  const confirmDelete = useDeleteConfirmation();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLImageElement>(null);
  const thumbnailKey = `${type}:${content?.id ?? ''}`;
  const isNewContent = hasSeededKnownContent && content != null && !knownContentKeys.has(thumbnailKey);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(!isNewContent || loadedThumbnailKeys.has(thumbnailKey));

  useEffect(() => {
    if (!hasSeededKnownContent && allContent.length > 0) {
      for (const item of allContent) knownContentKeys.add(`${item.type}:${item.id}`);
      hasSeededKnownContent = true;
    }
    if (content?.id) knownContentKeys.add(thumbnailKey);
  }, [allContent, thumbnailKey, content?.id]);

  const markThumbnailLoaded = useCallback(() => {
    loadedThumbnailKeys.add(thumbnailKey);
    setThumbnailLoaded(true);
  }, [thumbnailKey]);

  useLayoutEffect(() => {
    const img = thumbnailRef.current;
    if (img?.complete && img.naturalWidth > 0) markThumbnailLoaded();
  }, [markThumbnailLoaded]);

  if (isLoading) {
    return (
      <div className="bg-chibangarx-card border border-chibangarx-border rounded-xl w-full">
        <div className="relative aspect-video bg-chibangarx-bg">
          <div className="skeleton w-full h-full bg-chibangarx-border-secondary animate-pulse" />
        </div>
        <div className="p-3 space-y-2">
          <div className="skeleton h-4 w-3/4 bg-chibangarx-border-secondary animate-pulse rounded" />
          <div className="skeleton h-3 w-1/2 bg-chibangarx-border-secondary animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const getThumbnailPath = (): string => {
    const folderName = type === 'Session' ? 'Full Sessions' : type === 'Buffer' ? 'Replay Buffers' : type === 'Clip' ? 'Clips' : 'Highlights';
    return `${cacheFolder}/thumbnails/${folderName}/${content?.id}.jpeg`;
  };

  const formatDuration = (duration: string): string => {
    try {
      const time = duration.split('.')[0];
      const [hours, minutes, seconds] = time.split(':').map(Number);
      if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch { return '00:00'; }
  };

  const thumbnailPath = getThumbnailPath();
  const formattedDuration = formatDuration(content!.duration);
  const manualBookmarkCount = content?.bookmarks?.filter((b) => b.type === BookmarkType.Manual).length ?? 0;

  const isRecent = useMemo((): boolean => {
    if (!content) return false;
    const viewedContent = localStorage.getItem('viewed-content') || '{}';
    const viewedContentObj = JSON.parse(viewedContent);
    if (viewedContentObj[content.id]) return false;
    const createdAt = new Date(content.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 1;
  }, [content?.id, content?.createdAt]);

  const markAsViewed = () => {
    if (!content) return;
    const viewedContent = localStorage.getItem('viewed-content') || '{}';
    const viewedContentObj = JSON.parse(viewedContent);
    viewedContentObj[content.id] = true;
    localStorage.setItem('viewed-content', JSON.stringify(viewedContentObj));
  };

  const handleDelete = () => {
    confirmDelete({
      title: `Delete ${type.toLowerCase()}?`,
      description: <>Are you sure you want to permanently delete <strong>{content!.title || content!.game || content!.fileName}</strong>?<br /><span className="text-sm text-chibangarx-text-secondary">This action cannot be undone.</span></>,
      onConfirm: () => sendMessageToBackend('DeleteContent', { Id: content!.id }),
    });
  };

  const startRenaming = () => { setRenameValue(content!.title || ''); setIsRenaming(true); setTimeout(() => { renameInputRef.current?.focus(); renameInputRef.current?.select(); }, 0); };
  const commitRename = () => {
    if (!isRenaming) return;
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    const invalidChars = /[<>:"/\\|?*]/;
    if (trimmed && invalidChars.test(trimmed)) return;
    sendMessageToBackend('RenameContent', { Id: content!.id, Title: trimmed });
    patchContent(content!.id, { title: trimmed });
  };

  const hasHighlightBookmarks = content?.bookmarks?.some((bookmark) => includeInHighlight(bookmark.type));

  return (
    <div
      data-content-id={content!.id}
      className={`bg-chibangarx-card border rounded-xl w-full cursor-pointer transition-all ${
        isSelected ? '!outline !outline-2 !outline-chibangarx-primary border-chibangarx-primary' : 'border-chibangarx-border hover:border-chibangarx-primary/50'
      } ${isHighlighted ? 'ring-2 ring-chibangarx-primary/50' : ''} ${isSelectionMode ? 'select-none' : ''}`}
      onClick={() => { if (!isSelectionMode) markAsViewed(); onClick?.(content!); }}
    >
      <figure className="relative aspect-video bg-chibangarx-bg">
        <div className={`absolute inset-0 rounded-t-xl bg-chibangarx-border-secondary transition-opacity duration-200 ${thumbnailLoaded ? 'opacity-0' : 'animate-pulse opacity-100'}`} />
        <img
          ref={thumbnailRef}
          src={thumbnailPath}
          alt="thumbnail"
          className={`w-full h-full object-contain select-none transition-opacity duration-200 ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy" width={1600} height={900} draggable={false}
          onLoad={markThumbnailLoaded} onError={markThumbnailLoaded}
        />
        <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">{formattedDuration}</span>
        {manualBookmarkCount > 0 && (
          <span className="absolute top-2 right-2 bg-black/75 text-yellow-400 text-xs px-2 py-1 rounded">
            <Bookmark size={12} fill="currentColor" className="inline align-middle mr-1" />
            <span className="align-middle">{manualBookmarkCount}</span>
          </span>
        )}
        {isSelectionMode && (
          <input type="checkbox" className="absolute top-2 left-2 w-4 h-4 accent-chibangarx-primary rounded" checked={isSelected} readOnly />
        )}
        {isRecent && (type === 'Session' || type === 'Buffer') && showNewBadgeOnVideos && !isSelectionMode && (
          <span className="absolute top-2 left-2 bg-chibangarx-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">NEW</span>
        )}
      </figure>
      <div className="p-3">
        <div className="flex justify-between items-center">
          {isRenaming ? (
            <input ref={renameInputRef} type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitRename(); } else if (e.key === 'Escape') { e.preventDefault(); setIsRenaming(false); } }}
              onClick={(e) => e.stopPropagation()} className="text-sm font-medium bg-transparent outline-none w-full text-chibangarx-text border-b border-chibangarx-primary"
              placeholder={content!.game || 'Untitled'} />
          ) : (
            <h2 className="text-sm font-medium truncate">{content!.title || content!.game || 'Untitled'}</h2>
          )}
          <div ref={dropdownRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button className="p-1 rounded hover:bg-chibangarx-border-secondary" onClick={(e) => { e.preventDefault(); startRenaming(); }}>
              <Ellipsis size={18} className="text-chibangarx-text-secondary" />
            </button>
          </div>
        </div>
        <div className="text-xs text-chibangarx-text-secondary flex items-center justify-between mt-1">
          <span>{content!.fileSize} &bull; {new Date(content!.createdAt).toLocaleDateString()}</span>
        </div>
        {type === 'Session' && enableAi && (
          <button
            className={`mt-2 text-xs px-2 py-1 rounded-lg transition-colors ${hasHighlightBookmarks ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-chibangarx-border-secondary text-chibangarx-text-secondary cursor-not-allowed'}`}
            disabled={!hasHighlightBookmarks}
            onClick={() => sendMessageToBackend('CreateAiClip', { Id: content!.id })}
          >
            <Crown size={12} className="inline mr-1" />
            {hasHighlightBookmarks ? 'Create Highlight' : 'No Highlights'}
          </button>
        )}
      </div>
    </div>
  );
}
