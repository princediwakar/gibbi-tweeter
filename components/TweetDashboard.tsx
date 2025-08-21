'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Bot, 
  Send, 
  Plus, 
  Play, 
  Pause, 
  Trash2,
  Twitter 
} from 'lucide-react';
import { toast } from 'sonner';
import { getNextOptimalPostTime, getOptimalPostingSchedule, formatOptimalTime, toDateTimeLocal, formatISTTime } from '@/lib/timing';

interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  persona: string;
  scheduledFor?: Date;
  postedAt?: Date;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  createdAt: Date;
}


const personas = [
  {
    id: 'unhinged_satirist',
    name: 'Unhinged Satirist',
    description: 'Sharp Indian satirist with cultural references, exaggeration, and absurd metaphors',
    emoji: '🃏'
  },
  
];

export default function TweetDashboard() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    persona: 'unhinged_satirist',
    includeHashtags: true,
    customPrompt: ''
  });

  const [bulkGenerateForm, setBulkGenerateForm] = useState({
    bulkPrompt: '',
    count: 5,
    persona: 'unhinged_satirist',
    includeHashtags: true
  });

  const [selectedTweets, setSelectedTweets] = useState<string[]>([]);

  useEffect(() => {
    fetchTweets();
  }, []);

  // Auto-enable/disable scheduler based on scheduled tweets
  useEffect(() => {
    const scheduledCount = tweets.filter(t => t.status === 'scheduled').length;
    const shouldBeRunning = scheduledCount > 0;
    
    if (shouldBeRunning && !schedulerRunning) {
      // Auto-start scheduler when we have scheduled tweets
      toggleScheduler('start');
    } else if (!shouldBeRunning && schedulerRunning) {
      // Auto-stop scheduler when no scheduled tweets
      toggleScheduler('stop');
    }
  }, [tweets, schedulerRunning]);

  const fetchTweets = async () => {
    try {
      const response = await fetch('/api/tweets');
      const data = await response.json();
      const processedTweets = data.map((tweet: Tweet & { createdAt: string; scheduledFor?: string; postedAt?: string }) => ({
        ...tweet,
        createdAt: new Date(tweet.createdAt),
        scheduledFor: tweet.scheduledFor ? new Date(tweet.scheduledFor) : undefined,
        postedAt: tweet.postedAt ? new Date(tweet.postedAt) : undefined,
      }));
      
      // Sort in reverse chronological order (newest first)
      processedTweets.sort((a: Tweet, b: Tweet) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setTweets(processedTweets);
    } catch (error) {
      console.error('Failed to fetch tweets:', error);
      toast.error('Failed to fetch tweets');
    }
  };

  const generateTweet = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          ...generateForm
        })
      });
      
      if (response.ok) {
        toast.success('Tweet generated as draft!');
        fetchTweets();
      } else {
        toast.error('Failed to generate tweet');
      }
    } catch (error) {
      console.error('Failed to generate tweet:', error);
      toast.error('Failed to generate tweet');
    } finally {
      setLoading(false);
    }
  };

  const generateAndScheduleTweet = async () => {
    setLoading(true);
    try {
      // Get the next optimal posting time based on existing scheduled tweets
      const lastScheduledTweet = tweets
        .filter(t => t.status === 'scheduled' && t.scheduledFor)
        .sort((a, b) => (b.scheduledFor?.getTime() || 0) - (a.scheduledFor?.getTime() || 0))[0];
      
      const startFromTime = lastScheduledTweet?.scheduledFor || new Date();
      const scheduledFor = getNextOptimalPostTime(startFromTime);

      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-and-schedule',
          ...generateForm,
          scheduledFor: scheduledFor.toISOString()
        })
      });

      if (response.ok) {
        toast.success(`Tweet scheduled for optimal time: ${formatOptimalTime(scheduledFor)}!`);
        fetchTweets();
      } else {
        toast.error('Failed to generate and schedule tweet');
      }
    } catch (error) {
      console.error('Failed to generate and schedule tweet:', error);
      toast.error('Failed to generate and schedule tweet');
    } finally {
      setLoading(false);
    }
  };

  const bulkGenerateTweets = async () => {
    setLoading(true);
    try {
      const promises = [];
      
      for (let i = 0; i < bulkGenerateForm.count; i++) {
        const promise = fetch('/api/tweets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate',
            customPrompt: `${bulkGenerateForm.bulkPrompt} (Tweet ${i + 1} of ${bulkGenerateForm.count} - make each unique)`,
            persona: bulkGenerateForm.persona,
            includeHashtags: bulkGenerateForm.includeHashtags
          })
        });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const generatedTweets = [];
      
      for (const response of responses) {
        if (response.ok) {
          const tweet = await response.json();
          generatedTweets.push(tweet);
        }
      }

      toast.success(`Generated ${generatedTweets.length} tweets successfully!`);
      fetchTweets();
    } catch (error) {
      console.error('Failed to bulk generate tweets:', error);
      toast.error('Failed to bulk generate tweets');
    } finally {
      setLoading(false);
    }
  };

  const scheduleSelectedTweets = async () => {
    if (selectedTweets.length === 0) {
      toast.error('Please select tweets to schedule');
      return;
    }

    try {
      let scheduledCount = 0;
      
      // Get optimal posting schedule for selected tweets
      const optimalTimes = getOptimalPostingSchedule(selectedTweets.length);

      for (let i = 0; i < selectedTweets.length; i++) {
        const tweetId = selectedTweets[i];
        const tweet = tweets.find(t => t.id === tweetId);
        
        if (tweet && tweet.status === 'draft') {
          const scheduledFor = optimalTimes[i];
          
          const response = await fetch('/api/tweets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'schedule',
              content: tweet.content,
              hashtags: tweet.hashtags,
              persona: tweet.persona,
              scheduledFor: scheduledFor.toISOString()
            })
          });

          if (response.ok) {
            scheduledCount++;
            await fetch(`/api/tweets/${tweetId}`, { method: 'DELETE' });
          }
        }
      }

      toast.success(`Scheduled ${scheduledCount} tweets!`);
      setSelectedTweets([]);
      fetchTweets();
    } catch (error) {
      console.error('Failed to schedule tweets:', error);
      toast.error('Failed to schedule tweets');
    }
  };

  const postTweet = async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post' })
      });
      
      if (response.ok) {
        toast.success('Tweet posted successfully!');
        fetchTweets();
      } else {
        toast.error('Failed to post tweet');
      }
    } catch (error) {
      console.error('Failed to post tweet:', error);
      toast.error('Failed to post tweet');
    }
  };

  const deleteTweet = async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Tweet deleted successfully!');
        fetchTweets();
      } else {
        toast.error('Failed to delete tweet');
      }
    } catch (error) {
      console.error('Failed to delete tweet:', error);
      toast.error('Failed to delete tweet');
    }
  };

  const deleteSelectedTweets = async () => {
    if (selectedTweets.length === 0) {
      toast.error('No tweets selected');
      return;
    }

    try {
      // Delete all selected tweets in parallel
      const deletePromises = selectedTweets.map(tweetId => 
        fetch(`/api/tweets/${tweetId}`, { method: 'DELETE' })
      );
      
      const responses = await Promise.all(deletePromises);
      const successCount = responses.filter(r => r.ok).length;
      
      if (successCount === selectedTweets.length) {
        toast.success(`Deleted ${successCount} tweets successfully!`);
      } else if (successCount > 0) {
        toast.success(`Deleted ${successCount} of ${selectedTweets.length} tweets`);
      } else {
        toast.error('Failed to delete tweets');
      }
      
      setSelectedTweets([]);
      fetchTweets();
    } catch (error) {
      toast.error('Failed to delete selected tweets');
    }
  };

  const toggleScheduler = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        setSchedulerRunning(action === 'start');
        toast.success(`Scheduler ${action}ed successfully!`);
      } else {
        toast.error(`Failed to ${action} scheduler`);
      }
    } catch (error) {
      console.error(`Failed to ${action} scheduler:`, error);
      toast.error(`Failed to ${action} scheduler`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      posted: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const stats = {
    total: tweets.length,
    scheduled: tweets.filter(t => t.status === 'scheduled').length,
    posted: tweets.filter(t => t.status === 'posted').length,
    drafts: tweets.filter(t => t.status === 'draft').length
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Twitter className="h-6 w-6 text-blue-500" />
            AI Tweet Bot
          </h1>
          <p className="text-gray-600 text-sm">
            Multi-persona AI: 🃏 Indian Satirist • 🎭 Comedian • 🧠 Quiz Expert • ⚡ Motivational
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${schedulerRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              Auto-Post: {schedulerRunning ? 'Active' : 'Inactive'}
            </span>
            <span className="text-xs text-gray-500">
              ({stats.scheduled} scheduled)
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-3">
          <div className="text-xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="p-3">
          <div className="text-xl font-bold text-gray-600">{stats.drafts}</div>
          <div className="text-sm text-gray-600">Drafts</div>
        </Card>
        <Card className="p-3">
          <div className="text-xl font-bold text-blue-600">{stats.scheduled}</div>
          <div className="text-sm text-gray-600">Scheduled</div>
        </Card>
        <Card className="p-3">
          <div className="text-xl font-bold text-green-600">{stats.posted}</div>
          <div className="text-sm text-gray-600">Posted</div>
        </Card>
      </div>

      {/* Generation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Single Tweet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Single Tweet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={generateForm.persona}
              onChange={(e) => setGenerateForm(prev => ({ ...prev, persona: e.target.value }))}
              className="p-2 border rounded text-sm w-full"
            >
              {personas.map(persona => (
                <option key={persona.id} value={persona.id}>
                  {persona.emoji} {persona.name}
                </option>
              ))}
            </select>
            <Textarea
              value={generateForm.customPrompt}
              onChange={(e) => setGenerateForm(prev => ({ ...prev, customPrompt: e.target.value }))}
              placeholder="Custom prompt (optional - overrides topic/persona)"
              className="min-h-16 text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={generateForm.includeHashtags}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                  />
                  Hashtags
                </label>
                <span className="text-xs text-gray-500">
                  ⏰ Next optimal: {formatOptimalTime(getNextOptimalPostTime())}
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={generateTweet} disabled={loading} size="sm" variant="outline">
                  Draft
                </Button>
                <Button onClick={generateAndScheduleTweet} disabled={loading} size="sm">
                  Generate & Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Generation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Bulk Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={bulkGenerateForm.bulkPrompt}
              onChange={(e) => setBulkGenerateForm(prev => ({ ...prev, bulkPrompt: e.target.value }))}
              placeholder="Generate multiple tweets about bangalore traffic, each unique and hilarious..."
              className="min-h-16 text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select
                  value={bulkGenerateForm.count}
                  onChange={(e) => setBulkGenerateForm(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                  className="p-1 border rounded text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
                <select
                  value={bulkGenerateForm.persona}
                  onChange={(e) => setBulkGenerateForm(prev => ({ ...prev, persona: e.target.value }))}
                  className="p-1 border rounded text-sm"
                >
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.emoji}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">
                  📅 Optimal schedule for {bulkGenerateForm.count} tweets
                </span>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={bulkGenerateForm.includeHashtags}
                    onChange={(e) => setBulkGenerateForm(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                  />
                  #
                </label>
              </div>
              <Button
                onClick={bulkGenerateTweets}
                disabled={loading || !bulkGenerateForm.bulkPrompt}
                size="sm"
              >
                {loading ? 'Generating...' : `Generate ${bulkGenerateForm.count}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tweet Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tweet Management</CardTitle>
            {selectedTweets.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={scheduleSelectedTweets} size="sm">
                  Schedule {selectedTweets.length} Selected
                </Button>
                <Button 
                  onClick={deleteSelectedTweets} 
                  size="sm" 
                  variant="destructive"
                >
                  Delete {selectedTweets.length} Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTweets(tweets.filter(t => t.status === 'draft').map(t => t.id));
                        } else {
                          setSelectedTweets([]);
                        }
                      }}
                      checked={selectedTweets.length > 0 && selectedTweets.length === tweets.filter(t => t.status === 'draft').length}
                    />
                  </TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-12">👤</TableHead>
                  <TableHead className="w-36">Timing</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {tweets.map((tweet) => (
                <TableRow key={tweet.id}>
                  <TableCell>
                    {tweet.status === 'draft' && (
                      <input
                        type="checkbox"
                        checked={selectedTweets.includes(tweet.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTweets([...selectedTweets, tweet.id]);
                          } else {
                            setSelectedTweets(selectedTweets.filter(id => id !== tweet.id));
                          }
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm leading-relaxed break-words max-w-md">
                      {tweet.content}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tweet.hashtags.map((hashtag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                    <div className={`text-xs mt-1 ${tweet.content.length > 280 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                      {tweet.content.length}/280 chars
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(tweet.status)}>
                      {tweet.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {personas.find(p => p.id === tweet.persona)?.emoji || '🤖'}
                    </span>
                  </TableCell>
                  <TableCell className="w-48">
                    {tweet.status === 'scheduled' && tweet.scheduledFor && (
                      <div className="space-y-1">
                        <input
                          type="datetime-local"
                          value={toDateTimeLocal(tweet.scheduledFor)}
                          onChange={async (e) => {
                            const newTime = new Date(e.target.value);
                            try {
                              const response = await fetch(`/api/tweets/${tweet.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: 'update',
                                  scheduledFor: newTime.toISOString()
                                })
                              });
                              if (response.ok) {
                                fetchTweets();
                                toast.success('Schedule updated!');
                              }
                            } catch (error) {
                              toast.error('Failed to update schedule');
                            }
                          }}
                          className="text-xs border rounded px-1 py-1 w-full"
                        />
                        <div className="text-xs text-gray-500 break-words">
                          {formatOptimalTime(tweet.scheduledFor)}
                        </div>
                      </div>
                    )}
                    {tweet.status === 'posted' && tweet.postedAt && (
                      <div className="text-xs text-green-600 break-words">
                        {formatISTTime(tweet.postedAt)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(tweet.status === 'draft' || tweet.status === 'failed') && (
                        <Button
                          size="sm"
                          onClick={() => postTweet(tweet.id)}
                          className="h-6 text-xs px-2"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTweet(tweet.id)}
                        className="h-6 text-xs px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {tweets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tweets found. Generate your first tweet!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}