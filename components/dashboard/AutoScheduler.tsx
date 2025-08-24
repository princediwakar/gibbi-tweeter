// Removed unused imports
import { formatWithTimezone, getRelativeTime, getNextOptimalPostingTimeET } from '@/lib/datetime';
import { useClientSafe } from '@/hooks/useClientSafe';

interface AutoSchedulerProps {
  nextPostTime?: string;
}

export function AutoScheduler({ nextPostTime }: AutoSchedulerProps) {
  const isClient = useClientSafe();
  
  // Calculate next optimal posting time if not provided (ET-based business logic)
  const nextOptimalTime = isClient ? getNextOptimalPostingTimeET() : null;
  const displayNextPostTime = nextPostTime || (nextOptimalTime ? nextOptimalTime.toISOString() : null);
  
  // Determine display format
  const useCalculatedTime = !nextPostTime && nextOptimalTime;
  
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
        <div className="bg-green-900 text-green-200 px-6 py-2 rounded-lg border border-green-700 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>✅ Automation Active</span>
          </div>
          <div className="text-xs text-green-300 mt-1">System running continuously</div>
        </div>
      </div>
      
      <div className="bg-gray-950 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayNextPostTime && (
            <div className="space-y-2">
              <div className="text-xs uppercase text-gray-400 tracking-wide">Next Optimal Post Time</div>
              <div className="text-sm text-green-400 font-medium">
                {isClient ? (
                  useCalculatedTime 
                    ? formatWithTimezone(nextOptimalTime!, true)
                    : formatWithTimezone(new Date(displayNextPostTime), true)
                ) : 'Loading...'}
              </div>
              {isClient && (
                <div className="text-xs text-blue-300">
                  {useCalculatedTime 
                    ? getRelativeTime(nextOptimalTime!) 
                    : getRelativeTime(new Date(displayNextPostTime))}
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-xs uppercase text-gray-400 tracking-wide">System Status</div>
            <div className="text-sm text-blue-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Auto-posting at optimal times</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                15 daily slots: 7AM-10PM ET optimized for US student engagement
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}