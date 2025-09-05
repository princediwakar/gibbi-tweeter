import { GraduationCap, RefreshCw } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  stats: DashboardStats;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DashboardHeader({ 
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
            <h1 className="text-2xl font-bold text-white">Multi-Account Twitter Bot</h1>
          </div>
          <p className="text-gray-400 text-sm">AI-powered multi-account Twitter automation system</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-300">Auto Scheduler</span>
              <span className="font-medium text-green-400">ACTIVE</span>
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
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-300">Ready to Post</span>
              <span className="font-medium text-blue-400">{stats.ready}</span>
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