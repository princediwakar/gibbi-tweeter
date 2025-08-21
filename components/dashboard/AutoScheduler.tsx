import { Button } from '@/components/ui/button';
import { AutoSchedulerStats } from '@/types/dashboard';

interface AutoSchedulerProps {
  isRunning: boolean;
  loading: boolean;
  stats: AutoSchedulerStats | null;
  onToggle: (action: 'start' | 'stop') => void;
}

export function AutoScheduler({ isRunning, loading, stats, onToggle }: AutoSchedulerProps) {
  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🤖 Full Automation
          </h2>
          <p className="text-gray-400 text-sm">Automated tweet generation and posting</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => onToggle('start')}
            disabled={loading || isRunning}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isRunning ? 'Running...' : 'Start Auto'}
          </Button>
          <Button
            onClick={() => onToggle('stop')}
            disabled={loading || !isRunning}
            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Stop
          </Button>
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
                <div className="text-xs uppercase text-gray-400 tracking-wide">Next Run</div>
                <div className="text-sm text-green-400">{new Date(stats.nextRun).toLocaleString()}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="text-xs uppercase text-gray-400 tracking-wide">Statistics</div>
              <div className="space-y-1 text-sm">
                <div className="text-blue-400">Generated: {stats.totalGenerated}</div>
                <div className="text-purple-400">Posted: {stats.totalPosted}</div>
                {stats.lastRun && (
                  <div className="text-gray-400 text-xs">Last: {new Date(stats.lastRun).toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}