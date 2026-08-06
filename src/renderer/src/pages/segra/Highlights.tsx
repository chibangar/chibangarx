import { Crown } from 'lucide-react';
import { useAiHighlights } from './context/AiHighlightsContext';
import ContentPage from './components/ContentPage';

export default function Highlights() {
  const { aiProgress } = useAiHighlights();

  return (
    <ContentPage
      contentType="Highlight"
      sectionId="highlights"
      title="Highlights"
      Icon={Crown}
      progressItems={aiProgress}
      isProgressVisible={Object.keys(aiProgress).length > 0}
    />
  );
}
