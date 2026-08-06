import { Clapperboard } from 'lucide-react';
import { useClipping } from './context/ClippingContext';
import ContentPage from './components/ContentPage';
import ClippingCard from './components/ClippingCard';

export default function Clips() {
  const { clippingProgress, cancelClip } = useClipping();

  const progressCardElement =
    Object.keys(clippingProgress).length > 0 ? (
      <div key="clipping-progress" className="space-y-2">
        {Object.values(clippingProgress).map((clipping) => (
          <ClippingCard key={clipping.id} clipping={clipping} onCancel={cancelClip} />
        ))}
      </div>
    ) : null;

  return (
    <ContentPage
      contentType="Clip"
      sectionId="clips"
      title="Clips"
      Icon={Clapperboard}
      progressItems={clippingProgress}
      isProgressVisible={Object.keys(clippingProgress).length > 0}
      progressCardElement={progressCardElement}
    />
  );
}
