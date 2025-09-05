import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Send, Trash2 } from 'lucide-react';
import { Tweet } from '@/types/dashboard';
import { useClientSafe } from '@/hooks/useClientSafe';

interface TweetHistoryProps {
  tweets: Tweet[];
  selectedTweets: string[];
  onSelectionChange: (tweetIds: string[]) => void;
  onDeleteSelected: () => void;
  onPostTweet: (tweetId: string) => void;
  onDeleteTweet: (tweetId: string) => void;
  getStatusBadgeColor: (status: string) => string;
  getQualityGradeColor: (grade: string) => string;
  formatForUserDisplay: (date: Date | string) => string;
  // Pagination props
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
}

export function TweetHistory({
  tweets,
  selectedTweets,
  onSelectionChange,
  onDeleteSelected,
  onPostTweet,
  onDeleteTweet,
  getStatusBadgeColor,
  getQualityGradeColor,
  formatForUserDisplay,
  pagination,
  onPageChange,
  onPageSizeChange,
}: TweetHistoryProps) {
  const isClient = useClientSafe();
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(tweets.filter(t => t.status === 'ready').map(t => t.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectTweet = (tweetId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTweets, tweetId]);
    } else {
      onSelectionChange(selectedTweets.filter(id => id !== tweetId));
    }
  };


  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      {/* Bulk Actions */}
      {selectedTweets.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={onDeleteSelected} 
            className="bg-red-900 hover:bg-red-800 text-gray-200 h-8 text-sm"
          >
            Delete {selectedTweets.length}
          </Button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block border border-gray-600 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600 hover:bg-gray-900">
              <TableHead className="w-8 text-gray-200">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedTweets.length > 0 && selectedTweets.length === tweets.filter(t => t.status === 'ready').length}
                  className="accent-blue-500"
                />
              </TableHead>
              <TableHead className="text-gray-200">Content</TableHead>
              <TableHead className="w-16 text-gray-200">Quality</TableHead>
              <TableHead className="w-20 text-gray-200">Status</TableHead>
              <TableHead className="w-36 text-gray-200">Timing</TableHead>
              <TableHead className="w-16 text-gray-200">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tweets.map((tweet) => (
              <TableRow key={tweet.id} className="border-gray-600 hover:bg-gray-900">
                <TableCell>
                  {tweet.status === 'ready' && (
                    <input
                      type="checkbox"
                      checked={selectedTweets.includes(tweet.id)}
                      onChange={(e) => handleSelectTweet(tweet.id, e.target.checked)}
                      className="accent-blue-500"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm leading-relaxed break-words max-w-md text-gray-200">
                    {tweet.content}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tweet.hashtags.map((hashtag, index) => (
                      <Badge key={index} className="bg-gray-700 text-gray-200 text-xs">
                        {hashtag}
                      </Badge>
                    ))}
                  </div>
                  <div className={`text-xs mt-1 ${tweet.content.length > 270 ? 'text-red-400' : 'text-gray-400'}`}>
                    {tweet.content.length}/270
                  </div>
                </TableCell>
                <TableCell>
                  {tweet.qualityScore && (
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getQualityGradeColor(tweet.qualityScore.grade)}`}>
                        {tweet.qualityScore.grade}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(tweet.status)}>{tweet.status}</Badge>
                </TableCell>
                <TableCell>
                  {tweet.status === 'posted' && tweet.posted_at && (
                    <div className="text-xs text-green-400 break-words">
                      {isClient ? formatForUserDisplay(new Date(tweet.posted_at)) : 'Loading...'}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {(tweet.status === 'ready' || tweet.status === 'failed') && (
                      <Button
                        onClick={() => onPostTweet(tweet.id)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-200 h-6 text-xs px-2"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      onClick={() => onDeleteTweet(tweet.id)}
                      className="bg-red-900 hover:bg-red-800 text-gray-200 h-6 text-xs px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tweets.length === 0 && (
          <div className="text-center py-8 text-gray-400">No tweets in history.</div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {tweets.length === 0 && (
          <div className="text-center py-8 text-gray-400">No tweets in history.</div>
        )}
        {tweets.map((tweet) => (
          <div key={tweet.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            {/* Mobile Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {tweet.status === 'ready' && (
                  <input
                    type="checkbox"
                    checked={selectedTweets.includes(tweet.id)}
                    onChange={(e) => handleSelectTweet(tweet.id, e.target.checked)}
                    className="accent-blue-500"
                  />
                )}
                <Badge className={getStatusBadgeColor(tweet.status)}>{tweet.status}</Badge>
                {tweet.qualityScore && (
                  <div className={`text-sm font-bold ${getQualityGradeColor(tweet.qualityScore.grade)}`}>
                    Grade: {tweet.qualityScore.grade}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {(tweet.status === 'ready' || tweet.status === 'failed') && (
                  <Button
                    onClick={() => onPostTweet(tweet.id)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 h-8 w-8 p-1"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={() => onDeleteTweet(tweet.id)}
                  className="bg-red-900 hover:bg-red-800 text-gray-200 h-8 w-8 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Card Content */}
            <div className="space-y-3">
              <div className="text-sm leading-relaxed text-gray-200">
                {tweet.content}
              </div>
              
              {tweet.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tweet.hashtags.map((hashtag, index) => (
                    <Badge key={index} className="bg-gray-700 text-gray-200 text-xs">{hashtag}</Badge>
                  ))}
                </div>
              )}

              <div className={`text-xs ${tweet.content.length > 270 ? 'text-red-400' : 'text-gray-400'}`}>
                {tweet.content.length}/270 characters
              </div>


              {tweet.status === 'posted' && tweet.posted_at && (
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-green-400">
                    Posted: {isClient ? formatForUserDisplay(new Date(tweet.posted_at)) : 'Loading...'}
                  </div>
                  {tweet.twitter_url && (
                    <a 
                      href={tweet.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      View on X →
                    </a>
                  )}
                </div>
              )}

              {tweet.status === 'failed' && tweet.error_message && (
                <div className="bg-red-950 border border-red-800 rounded p-3">
                  <div className="text-xs text-red-400">
                    Error: {tweet.error_message}
                  </div>
                </div>
              )}

              {tweet.status === 'ready' && (
                <div className="text-xs text-gray-400">
                  Ready to post
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </section>
  );
}