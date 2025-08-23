import { Button } from '@/components/ui/button';
import { AutoSchedulerStats } from '@/types/dashboard';
import { formatExactTimeIST, getTimeUntil, getNextOptimalPostingTimeIST, formatISTTimeDirect } from '@/lib/timezone';
import { useClientSafe } from '@/hooks/useClientSafe';

interface AutoSchedulerProps {
  loading: boolean;
  autoChainRunning: boolean;
  stats: AutoSchedulerStats | null;
  nextPostTime?: string;
  onToggle: (action: 'start-chain' | 'stop-chain') => void;
}

export function AutoScheduler({ loading, autoChainRunning, nextPostTime, onToggle }: AutoSchedulerProps) {
  const isClient = useClientSafe();
  
  // Calculate next optimal posting time if not provided
  const nextOptimalTime = isClient ? getNextOptimalPostingTimeIST() : null;
  const displayNextPostTime = nextPostTime || (nextOptimalTime ? nextOptimalTime.toISOString() : null);
  
  // Determine if we should use direct IST formatting (for calculated times) or UTC conversion (for stored times)
  const useDirectIST = !nextPostTime && nextOptimalTime;
  
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
      
      {(autoChainRunning || displayNextPostTime) && (
        <div className="bg-gray-950 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayNextPostTime && (
              <div className="space-y-2">
                <div className="text-xs uppercase text-gray-400 tracking-wide">Next Optimal Post Time</div>
                <div className="text-sm text-green-400 font-medium">
                  {isClient ? (
                    useDirectIST ? formatISTTimeDirect(nextOptimalTime!) : formatExactTimeIST(new Date(displayNextPostTime))
                  ) : 'Loading...'}
                </div>
                {isClient && (
                  <div className="text-xs text-blue-300">
                    {useDirectIST ? getTimeUntil(nextOptimalTime!) : getTimeUntil(new Date(displayNextPostTime))}
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
                    <span>Auto-posting at optimal times</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    15 daily slots: 8AM-10PM IST at optimal engagement times
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}