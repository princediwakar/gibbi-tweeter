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
    
    // Multi-account state
    accounts,
    selectedAccount,
    
    // Actions
    setSelectedTweets,
    setShowHistory,
    setGenerateForm,
    generateTweet,
    bulkGenerateTweets,
    postTweet,
    deleteTweet,
    deleteSelectedTweets,
    shareOnX,
    refreshData,
    
    // Account actions
    switchAccount,
    refreshAccounts,
    
    // Pagination actions
    goToPage,
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
        {/* Account Selector */}
        {accounts.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-300">
                  Active Account:
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => switchAccount(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.twitter_handle})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={refreshAccounts}
                className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded"
              >
                Refresh Accounts
              </button>
            </div>
          </div>
        )}

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