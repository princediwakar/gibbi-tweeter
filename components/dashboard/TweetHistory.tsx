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
  onScheduleSelected: () => void;
  onDeleteSelected: () => void;
  onPostTweet: (tweetId: string) => void;
  onDeleteTweet: (tweetId: string) => void;
  onUpdateSchedule: (tweetId: string, newTime: Date) => void;
  getStatusBadgeColor: (status: string) => string;
  getQualityGradeColor: (grade: string) => string;
  toDateTimeLocal: (date: Date) => string;
  formatOptimalTime: (date: Date) => string;
  formatISTTime: (date: Date) => string;
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
  onScheduleSelected,
  onDeleteSelected,
  onPostTweet,
  onDeleteTweet,
  onUpdateSchedule,
  getStatusBadgeColor,
  getQualityGradeColor,
  toDateTimeLocal,
  formatOptimalTime,
  formatISTTime,
  pagination,
  onPageChange,
  onPageSizeChange,
}: TweetHistoryProps) {
  const isClient = useClientSafe();
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(tweets.filter(t => t.status === 'draft').map(t => t.id));
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

  const handleScheduleUpdate = async (tweetId: string, newTimeString: string) => {
    const newTime = new Date(newTimeString);
    onUpdateSchedule(tweetId, newTime);
  };

  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      {/* Bulk Actions */}
      {selectedTweets.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={onScheduleSelected} 
            className="bg-blue-900 hover:bg-blue-800 text-gray-200 h-8 text-sm"
          >
            Schedule {selectedTweets.length}
          </Button>
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
                  checked={selectedTweets.length > 0 && selectedTweets.length === tweets.filter(t => t.status === 'draft').length}
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
                  {tweet.status === 'draft' && (
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
                  <div className={`text-xs mt-1 ${tweet.content.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                    {tweet.content.length}/280
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
                  {tweet.status === 'scheduled' && tweet.scheduledFor && (
                    <div className="space-y-1">
                      <input
                        type="datetime-local"
                        value={toDateTimeLocal(new Date(tweet.scheduledFor))}
                        onChange={(e) => handleScheduleUpdate(tweet.id, e.target.value)}
                        className="text-xs bg-gray-800 border-gray-600 text-gray-200 rounded px-1 py-1 w-full"
                      />
                      <div className="text-xs text-gray-400 break-words">
                        {isClient ? formatOptimalTime(new Date(tweet.scheduledFor)) : 'Loading...'}
                      </div>
                    </div>
                  )}
                  {tweet.status === 'posted' && tweet.postedAt && (
                    <div className="text-xs text-green-400 break-words">
                      {isClient ? formatISTTime(new Date(tweet.postedAt)) : 'Loading...'}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {(tweet.status === 'draft' || tweet.status === 'failed') && (
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
                {tweet.status === 'draft' && (
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
                {(tweet.status === 'draft' || tweet.status === 'failed') && (
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

              <div className={`text-xs ${tweet.content.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                {tweet.content.length}/280 characters
              </div>

              {/* Mobile Card Timing */}
              {tweet.status === 'scheduled' && tweet.scheduledFor && (
                <div className="bg-gray-900 rounded p-3 space-y-2">
                  <div className="text-xs text-gray-400">Scheduled for:</div>
                  <input
                    type="datetime-local"
                    value={toDateTimeLocal(new Date(tweet.scheduledFor))}
                    onChange={(e) => handleScheduleUpdate(tweet.id, e.target.value)}
                    className="bg-gray-800 border-gray-600 text-gray-200 text-sm p-2 rounded w-full"
                  />
                  <div className="text-xs text-blue-400">
                    IST: {isClient ? formatOptimalTime(new Date(tweet.scheduledFor)) : 'Loading...'}
                  </div>
                </div>
              )}

              {tweet.status === 'posted' && tweet.postedAt && (
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-green-400">
                    Posted: {isClient ? formatISTTime(new Date(tweet.postedAt)) : 'Loading...'}
                  </div>
                  {tweet.twitterUrl && (
                    <a 
                      href={tweet.twitterUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      View on X →
                    </a>
                  )}
                </div>
              )}

              {tweet.status === 'failed' && tweet.errorMessage && (
                <div className="bg-red-950 border border-red-800 rounded p-3">
                  <div className="text-xs text-red-400">
                    Error: {tweet.errorMessage}
                  </div>
                </div>
              )}

              {tweet.status === 'draft' && (
                <div className="text-xs text-gray-400">
                  Ready to schedule or post
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