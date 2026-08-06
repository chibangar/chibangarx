import { useState, useRef, useEffect } from 'react';
import { useSettings } from './context/SettingsContext';
import CaptureModeSection from './components/settings/CaptureModeSection';
import VideoSettingsSection from './components/settings/VideoSettingsSection';
import AudioDevicesSection from './components/settings/AudioDevicesSection';
import ClipSettingsSection from './components/settings/ClipSettingsSection';
import HighlightsSection from './components/settings/HighlightsSection';
import StorageSettingsSection from './components/settings/StorageSettingsSection';
import PreferencesSection from './components/settings/PreferencesSection';
import AdvancedSection from './components/settings/AdvancedSection';

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'recording', label: 'Gravação' },
  { id: 'clips', label: 'Clips' },
  { id: 'storage', label: 'Armazenamento' },
  { id: 'preferences', label: 'Preferências' },
  { id: 'advanced', label: 'Avançado' },
];

export default function Settings() {
  const settings = useSettings();
  const [activeNav, setActiveNav] = useState('recording');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sections = container.querySelectorAll('[data-section]');
      let current = 'recording';
      for (const section of Array.from(sections)) {
        const rect = section.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top - containerRect.top <= 80) {
          current = section.getAttribute('data-section') || 'recording';
        }
      }
      setActiveNav(current);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const section = contentRef.current?.querySelector(`[data-section="${id}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-chibangarx-card border-b border-chibangarx-border px-6 py-3">
        <div className="flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeNav === item.id
                  ? 'bg-chibangarx-primary/15 text-chibangarx-primary'
                  : 'text-chibangarx-text-secondary hover:text-chibangarx-text hover:bg-chibangarx-border-secondary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        <div data-section="recording">
          <CaptureModeSection />
          <VideoSettingsSection />
          <AudioDevicesSection />
        </div>

        <div data-section="clips">
          <ClipSettingsSection />
          <HighlightsSection />
        </div>

        <div data-section="storage">
          <StorageSettingsSection />
        </div>

        <div data-section="preferences">
          <PreferencesSection />
        </div>

        <div data-section="advanced">
          <AdvancedSection />
        </div>
      </div>
    </div>
  );
}
