'use client';

import { useTweetDashboard } from '@/hooks/useTweetDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TweetPreview } from '@/components/dashboard/TweetPreview';
import { AutoScheduler } from '@/components/dashboard/AutoScheduler';
import { ManualGeneration } from '@/components/dashboard/ManualGeneration';
import { TweetHistoryToggle } from '@/components/dashboard/TweetHistoryToggle';
import { TweetHistory } from '@/components/dashboard/TweetHistory';

export default function TweetDashboard() {
  const {
    // State
    tweets,
    latestTweet,
    selectedTweets,
    loading,
    // Removed scheduler state - assuming always running
    showHistory,
    generateForm,
    pagination,
    stats,
    // hasHydrated, // Removed - not needed anymore
    
    // Actions
    setSelectedTweets,
    setShowHistory,
    setGenerateForm,
    generateTweet,
    generateAndScheduleTweet,
    bulkGenerateTweets,
    postTweet,
    deleteTweet,
    updateTweetSchedule,
    scheduleSelectedTweets,
    deleteSelectedTweets,
    // Removed toggleAutoScheduler
    shareOnX,
    refreshData,
    
    // Pagination actions
    goToPage,
    // nextPage,  // Currently unused
    // prevPage,  // Currently unused
    changePageSize,
    
    // Utilities
    getStatusBadgeColor,
    getQualityGradeColor,
    toDateTimeLocal,
    formatOptimalTime,
    formatForUserDisplay,
    getNextOptimalPostTime,
    
    // Constants
    personas,
    BULK_GENERATION_CONFIG,
  } = useTweetDashboard();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <DashboardHeader 
          stats={stats}
          onRefresh={refreshData}
          refreshing={loading}
        />

        {latestTweet && (
          <TweetPreview 
            tweet={latestTweet}
            personas={personas}
            onShare={shareOnX}
            loading={loading}
          />
        )}

        <AutoScheduler 
          nextPostTime={stats.nextPostTime ? (typeof stats.nextPostTime === 'string' ? stats.nextPostTime : stats.nextPostTime.toISOString()) : undefined}
        />

        <ManualGeneration 
          form={generateForm}
          loading={loading}
          nextOptimalTime={formatOptimalTime(getNextOptimalPostTime())}
          personas={personas}
          bulkCount={BULK_GENERATION_CONFIG.count}
          onFormChange={(updates) => setGenerateForm(prev => ({ ...prev, ...updates }))}
          onGenerate={generateTweet}
          onGenerateAndSchedule={generateAndScheduleTweet}
          onBulkGenerate={bulkGenerateTweets}
        />

        <TweetHistoryToggle 
          showHistory={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
        />

        {showHistory && (
          <TweetHistory 
            tweets={tweets}
            selectedTweets={selectedTweets}
            onSelectionChange={setSelectedTweets}
            onScheduleSelected={scheduleSelectedTweets}
            onDeleteSelected={deleteSelectedTweets}
            onPostTweet={postTweet}
            onDeleteTweet={deleteTweet}
            onUpdateSchedule={updateTweetSchedule}
            getStatusBadgeColor={getStatusBadgeColor}
            getQualityGradeColor={getQualityGradeColor}
            toDateTimeLocal={toDateTimeLocal}
            formatOptimalTime={formatOptimalTime}
            formatForUserDisplay={formatForUserDisplay}
            pagination={pagination}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />
        )}
      </div>
    </div>
  );
}