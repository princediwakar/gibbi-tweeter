import { Twitter } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';

interface DashboardHeaderProps {
  autoSchedulerRunning: boolean;
  schedulerRunning: boolean;
  stats: DashboardStats;
}

export function DashboardHeader({ autoSchedulerRunning, schedulerRunning, stats }: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-800 pb-8">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Twitter className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Tweet Generator</h1>
          </div>
          <p className="text-gray-400 text-sm">Automated content generation with multi-persona AI</p>
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