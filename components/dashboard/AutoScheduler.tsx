import { Button } from '@/components/ui/button';
import { AutoSchedulerStats } from '@/types/dashboard';
import { formatDateIST } from '@/lib/timezone';
import { useClientSafe } from '@/hooks/useClientSafe';

interface AutoSchedulerProps {
  loading: boolean;
  autoChainRunning: boolean;
  stats: AutoSchedulerStats | null;
  onToggle: (action: 'start-chain') => void;
}

export function AutoScheduler({ loading, autoChainRunning, stats, onToggle }: AutoSchedulerProps) {
  const isClient = useClientSafe();
  // Check if we're in production by looking at the stats note
  const isProd = isClient && stats?.note?.includes('Production');
  
  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🤖 Smart Automation
          </h2>
          <p className="text-gray-400 text-sm">
            Intelligent tweet generation and posting - 15 posts daily at optimal times
          </p>
        </div>
        <div className="flex gap-3">
          {autoChainRunning ? (
            <div className="bg-green-900 text-green-200 px-6 py-2 rounded-lg border border-green-700 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>✅ Automation Active</span>
              </div>
              <div className="text-xs text-green-300 mt-1">System running continuously</div>
            </div>
          ) : (
            <Button
              onClick={() => onToggle('start-chain')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              🚀 Start Automation
            </Button>
          )}
        </div>
      </div>
      
      {stats && (
        <div className="bg-gray-950 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs uppercase text-gray-400 tracking-wide">Schedule</div>
              <div className="text-sm text-gray-200">{stats.schedule}</div>
            </div>
            
            {stats.nextRun && (
              <div className="space-y-2">
                <div className="text-xs uppercase text-gray-400 tracking-wide">Next Run (IST)</div>
                <div className="text-sm text-green-400">{isClient ? formatDateIST(new Date(stats.nextRun)) : 'Loading...'}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="text-xs uppercase text-gray-400 tracking-wide">Statistics</div>
              <div className="space-y-1 text-sm">
                <div className="text-blue-400">Generated: {stats.totalGenerated}</div>
                <div className="text-purple-400">Posted: {stats.totalPosted}</div>
                {stats.lastRun && (
                  <div className="text-gray-400 text-xs">Last: {isClient ? formatDateIST(new Date(stats.lastRun)) : 'Loading...'}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}