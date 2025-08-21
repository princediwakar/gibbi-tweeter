import { Button } from '@/components/ui/button';
import { Twitter, Loader2 } from 'lucide-react';
import { Tweet, Persona } from '@/types/dashboard';

interface TweetPreviewProps {
  tweet: Tweet;
  personas: Persona[];
  onShare: (tweet: Tweet) => void;
  loading?: boolean;
}

export function TweetPreview({ tweet, personas, onShare, loading = false }: TweetPreviewProps) {
  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Tweet...
            </>
          ) : (
            <>
              ✨ Latest Generated Tweet
            </>
          )}
        </h2>
        <Button
          onClick={() => onShare(tweet)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Twitter className="h-4 w-4 mr-2" /> Share on X
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-950 rounded-lg p-4 border border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <span className="ml-3 text-gray-400">Generating fresh content...</span>
            </div>
          ) : (
            <>
              <p className="text-gray-100 leading-relaxed">{tweet.content}</p>
              {tweet.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tweet.hashtags.map((hashtag, index) => (
                    <span key={index} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-sm">
                      {hashtag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {!loading && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-400">
              <span>{tweet.content.length}/280 chars</span>
              <span>•</span>
              <span className={`font-medium ${
                tweet.qualityScore?.grade === 'A' ? 'text-green-400' :
                tweet.qualityScore?.grade === 'B' ? 'text-blue-400' :
                tweet.qualityScore?.grade === 'C' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                Grade: {tweet.qualityScore?.grade || 'N/A'}
              </span>
              <span>•</span>
              <span>{personas.find(p => p.id === tweet.persona)?.name || 'Unknown'}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}