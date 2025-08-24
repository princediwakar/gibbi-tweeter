import { GraduationCap, RefreshCw } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  autoSchedulerRunning: boolean;
  schedulerRunning: boolean;
  stats: DashboardStats;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DashboardHeader({ 
  autoSchedulerRunning, 
  schedulerRunning, 
  stats, 
  onRefresh,
  refreshing = false 
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-800 pb-8">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Test Prep Tweet Bot</h1>
          </div>
          <p className="text-gray-400 text-sm">Automated US test prep content for SAT, GRE, GMAT & more</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${autoSchedulerRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-gray-300">Auto Scheduler</span>
              <span className={`font-medium ${autoSchedulerRunning ? 'text-green-400' : 'text-gray-500'}`}>
                {autoSchedulerRunning ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${schedulerRunning ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
              <span className="text-gray-300">Scheduled Posts</span>
              <span className="font-medium text-blue-400">{stats.scheduled}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-300">Total Posted</span>
              <span className="font-medium text-purple-400">{stats.posted}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}