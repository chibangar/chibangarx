import { useSettings } from './context/SettingsContext';
import { useAppState } from './context/AppStateContext';
import RecordingCard from './components/RecordingCard';
import { sendMessageToBackend } from './utils/MessageUtils';
import { useClipping } from './context/ClippingContext';
import { useAiHighlights } from './context/AiHighlightsContext';
import ClippingCard from './components/ClippingCard';
import { Clapperboard, OctagonX, Settings, History, Crown, Monitor, Play, LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import Button from './components/Button';
import { MenuItemId, DEFAULT_MENU_ITEMS, menuItemHasContent } from './models/types';

interface MenuProps {
  selectedMenu: string;
  onSelectMenu: (menu: string) => void;
}

const MENU_ICONS: Record<MenuItemId, LucideIcon> = {
  'Full Sessions': Play,
  'Replay Buffer': History,
  Clips: Clapperboard,
  Highlights: Crown,
  Settings: Settings,
};

export default function Menu({ selectedMenu, onSelectMenu }: MenuProps) {
  const settings = useSettings();
  const appState = useAppState();
  const { recording, preRecording } = appState;
  const { aiProgress } = useAiHighlights();
  const { clippingProgress, cancelClip } = useClipping();
  const [buttonCooldown, setButtonCooldown] = useState(false);

  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [indicatorPosition, setIndicatorPosition] = useState({ top: 12 });
  const [indicatorAnimated, setIndicatorAnimated] = useState(false);

  const visibleMenuItems = useMemo(() => {
    const items = settings.menuItems && settings.menuItems.length > 0 ? settings.menuItems : DEFAULT_MENU_ITEMS;
    return items.filter(
      (item) => item.id === 'Settings' || item.visible || menuItemHasContent(item.id, appState.content),
    );
  }, [settings.menuItems, appState.content]);

  const computeIndicatorPosition = () => {
    if (!visibleMenuItems.some((item) => item.id === selectedMenu)) return;
    const rowEl = buttonRefs.current[selectedMenu];
    if (!rowEl) return;
    const buttonEl = rowEl.firstElementChild as HTMLElement | null;
    const buttonHeight = buttonEl?.offsetHeight || 48;
    const indicatorTop = rowEl.offsetTop + buttonHeight / 2 - 20;
    setIndicatorPosition({ top: indicatorTop });
  };

  useLayoutEffect(() => {
    computeIndicatorPosition();
    const timeoutId = setTimeout(computeIndicatorPosition, 220);
    return () => clearTimeout(timeoutId);
  }, [selectedMenu, visibleMenuItems]);

  useEffect(() => { setIndicatorAnimated(true); }, []);

  const aiProgressValues = Object.values(aiProgress);
  const hasActiveAiHighlights = aiProgressValues.length > 0;

  return (
    <div className="bg-chibangarx-card w-56 h-full flex flex-col border-r border-chibangarx-border">
      <div className="flex flex-col px-4 text-left py-2 relative mt-2">
        <div
          className={`absolute w-1.5 bg-chibangarx-primary rounded-r transition-all duration-200 ${indicatorAnimated ? 'transition-all' : ''}`}
          style={{ left: 0, top: `${indicatorPosition.top}px`, height: '40px' }}
        />
        <AnimatePresence initial={false} mode="popLayout">
          {visibleMenuItems.map(({ id }) => {
            const Icon = MENU_ICONS[id];
            const isActive = selectedMenu === id;
            return (
              <motion.div
                key={id}
                ref={(el) => { buttonRefs.current[id] = el; }}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden pb-2 last:pb-0"
              >
                <button
                  className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 border ${
                    isActive ? 'border-transparent text-chibangarx-primary' : 'text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary hover:text-chibangarx-text border-transparent'
                  }`}
                  onMouseDown={() => onSelectMenu(id)}
                >
                  <Icon className="w-5 h-5" />
                  {id}
                  {id === 'Highlights' && hasActiveAiHighlights && !isActive && (
                    <div className="ml-auto w-5 h-5 rounded-full border-2 border-chibangarx-primary border-t-transparent animate-spin" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="grow" />

      <div className="mt-auto p-2 space-y-2">
        <AnimatePresence>
          {(preRecording || (recording && recording.endTime == null)) && (
            <motion.div key="recording-card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <RecordingCard recording={recording} preRecording={preRecording} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {Object.values(clippingProgress).map((clipping) => (
            <motion.div key={clipping.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <ClippingCard clipping={clipping} onCancel={cancelClip} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mb-4 px-4">
        <Button
          variant="primary"
          className="w-full h-12 justify-center"
          disabled={buttonCooldown}
          onClick={() => {
            setButtonCooldown(true);
            setTimeout(() => setButtonCooldown(false), 1000);
            sendMessageToBackend(appState.recording || appState.preRecording ? 'StopRecording' : 'StartRecording');
          }}
        >
          {appState.recording || appState.preRecording ? (
            <><OctagonX className="w-4 h-4" /> Stop</>
          ) : (
            <><Monitor className="w-4 h-4" /> Start Recording</>
          )}
        </Button>
      </div>
    </div>
  );
}
