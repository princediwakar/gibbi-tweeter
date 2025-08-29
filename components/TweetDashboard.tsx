'use client';

import { useTweetDashboard } from '@/hooks/useTweetDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TweetPreview } from '@/components/dashboard/TweetPreview';
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
    showHistory,
    generateForm,
    pagination,
    stats,
    
    // Actions
    setSelectedTweets,
    setShowHistory,
    setGenerateForm,
    generateTweet,
    bulkGenerateTweets,
    postTweet,
    deleteTweet,
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
    formatForUserDisplay,
    
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

     
        <ManualGeneration 
          form={generateForm}
          loading={loading}
          personas={personas}
          bulkCount={BULK_GENERATION_CONFIG.count}
          onFormChange={(updates) => setGenerateForm(prev => ({ ...prev, ...updates }))}
          onGenerate={generateTweet}
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
            onDeleteSelected={deleteSelectedTweets}
            onPostTweet={postTweet}
            onDeleteTweet={deleteTweet}
            getStatusBadgeColor={getStatusBadgeColor}
            getQualityGradeColor={getQualityGradeColor}
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