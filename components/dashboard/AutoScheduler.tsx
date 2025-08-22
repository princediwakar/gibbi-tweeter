import { Button } from '@/components/ui/button';
import { AutoSchedulerStats } from '@/types/dashboard';
import { formatDateIST, formatExactTimeIST, getTimeUntil } from '@/lib/timezone';
import { useClientSafe } from '@/hooks/useClientSafe';

interface AutoSchedulerProps {
  loading: boolean;
  autoChainRunning: boolean;
  stats: AutoSchedulerStats | null;
  nextPostTime?: string;
  onToggle: (action: 'start-chain' | 'stop-chain') => void;
}

export function AutoScheduler({ loading, autoChainRunning, stats, nextPostTime, onToggle }: AutoSchedulerProps) {
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
            <div className="flex items-center gap-3">
              <div className="bg-green-900 text-green-200 px-6 py-2 rounded-lg border border-green-700 font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>✅ Automation Active</span>
                </div>
                <div className="text-xs text-green-300 mt-1">System running continuously</div>
              </div>
              <Button
                onClick={() => onToggle('stop-chain')}
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                ⏹️ Pause
              </Button>
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
      
      {(autoChainRunning || nextPostTime) && (
        <div className="bg-gray-950 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nextPostTime && (
              <div className="space-y-2">
                <div className="text-xs uppercase text-gray-400 tracking-wide">Next Post (IST)</div>
                <div className="text-sm text-green-400 font-medium">
                  {isClient ? formatExactTimeIST(new Date(nextPostTime)) : 'Loading...'}
                </div>
                {isClient && (
                  <div className="text-xs text-blue-300">
                    {getTimeUntil(new Date(nextPostTime))}
                  </div>
                )}
              </div>
            )}
            
            {autoChainRunning && (
              <div className="space-y-2">
                <div className="text-xs uppercase text-gray-400 tracking-wide">System Status</div>
                <div className="text-sm text-blue-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Auto-posting every 1-2 hours</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">15 posts daily at optimal times</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}