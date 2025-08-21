import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

interface TweetHistoryToggleProps {
  showHistory: boolean;
  onToggle: () => void;
}

export function TweetHistoryToggle({ showHistory, onToggle }: TweetHistoryToggleProps) {
  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <Button
        onClick={onToggle}
        className="bg-gray-800 hover:bg-gray-700 text-gray-200 w-full h-12 text-sm rounded-lg transition-colors"
      >
        {showHistory ? <X className="h-5 w-5 mr-2" /> : <Eye className="h-5 w-5 mr-2" />}
        {showHistory ? 'Hide Tweet History' : 'Show Tweet History'}
      </Button>
    </section>
  );
}