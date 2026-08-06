import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppStateProvider } from './segra/context/AppStateContext';
import { SettingsProvider } from './segra/context/SettingsContext';
import { SegmentsProvider } from './segra/context/SegmentsContext';
import { ClippingProvider } from './segra/context/ClippingContext';
import { AiHighlightsProvider } from './segra/context/AiHighlightsContext';
import { CompressionProvider } from './segra/context/CompressionContext';
import { SelectedVideoProvider, useSelectedVideo } from './segra/context/SelectedVideoContext';
import { SelectedMenuProvider, useSelectedMenu } from './segra/context/SelectedMenuContext';
import { ScrollProvider } from './segra/context/ScrollContext';
import { ModalProvider } from './segra/context/ModalContext';
import Menu from './segra/Menu';
import Sessions from './segra/Sessions';
import ReplayBuffer from './segra/ReplayBuffer';
import Clips from './segra/Clips';
import Highlights from './segra/Highlights';
import VideoEditor from './segra/VideoEditor';

function SegraApp() {
  const { selectedVideo, setSelectedVideo } = useSelectedVideo();
  const { selectedMenu, setSelectedMenu } = useSelectedMenu();

  const handleMenuSelection = (menu: string) => {
    setSelectedVideo(null);
    setSelectedMenu(menu);
  };

  const renderContent = () => {
    if (selectedVideo) {
      return (
        <DndProvider backend={HTML5Backend}>
          <VideoEditor />
        </DndProvider>
      );
    }

    switch (selectedMenu) {
      case 'Full Sessions': return <Sessions />;
      case 'Replay Buffer': return <ReplayBuffer />;
      case 'Clips': return <Clips />;
      case 'Highlights': return <Highlights />;
      default: return <Sessions />;
    }
  };

  return (
    <div className="flex h-full">
      <div className="h-full">
        <Menu selectedMenu={selectedMenu} onSelectMenu={handleMenuSelection} />
      </div>
      <div className="flex-1 h-full overflow-auto">{renderContent()}</div>
    </div>
  );
}

export default function GameClips() {
  return (
    <ScrollProvider>
      <SettingsProvider>
        <AppStateProvider>
          <ModalProvider>
            <SegmentsProvider>
              <DndProvider backend={HTML5Backend}>
                <ClippingProvider>
                  <AiHighlightsProvider>
                    <CompressionProvider>
                      <SelectedVideoProvider>
                        <SelectedMenuProvider>
                          <SegraApp />
                        </SelectedMenuProvider>
                      </SelectedVideoProvider>
                    </CompressionProvider>
                  </AiHighlightsProvider>
                </ClippingProvider>
              </DndProvider>
            </SegmentsProvider>
          </ModalProvider>
        </AppStateProvider>
      </SettingsProvider>
    </ScrollProvider>
  );
}
