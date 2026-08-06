import { History } from 'lucide-react';
import ContentPage from './components/ContentPage';

export default function ReplayBuffer() {
  return (
    <ContentPage
      contentType="Buffer"
      sectionId="replayBuffer"
      title="Replay Buffer"
      Icon={History}
    />
  );
}
