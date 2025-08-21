import { Button } from '@/components/ui/button';
import { Bot, Send, Plus } from 'lucide-react';
import { GenerateFormState, Persona } from '@/types/dashboard';

interface ManualGenerationProps {
  form: GenerateFormState;
  loading: boolean;
  nextOptimalTime: string;
  personas: Persona[];
  bulkCount: number;
  onFormChange: (updates: Partial<GenerateFormState>) => void;
  onGenerate: () => void;
  onGenerateAndSchedule: () => void;
  onBulkGenerate: () => void;
}

export function ManualGeneration({
  form,
  loading,
  nextOptimalTime,
  personas,
  bulkCount,
  onFormChange,
  onGenerate,
  onGenerateAndSchedule,
  onBulkGenerate
}: ManualGenerationProps) {
  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            📝 Manual Generation
          </h2>
          <p className="text-gray-400 text-sm">Create and customize individual tweets</p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
          Next Optimal: {nextOptimalTime}
        </div>
      </div>
      
      {/* Configuration Section */}
      <div className="mb-6">
        <div className="text-sm text-gray-300 mb-3 font-medium">Configuration</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Persona Selection */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Persona</label>
            <select
              value={form.persona}
              onChange={(e) => onFormChange({ persona: e.target.value as 'unhinged_satirist' })}
              className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-sm p-3 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              {personas.map(persona => (
                <option key={persona.id} value={persona.id}>
                  {persona.emoji} {persona.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Content Options */}
          <div className="space-y-3">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Content Options</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={form.includeHashtags}
                  onChange={(e) => onFormChange({ includeHashtags: e.target.checked })}
                  className="accent-blue-500 scale-110"
                />
                <span className="text-sm text-gray-200">#️⃣ Include Hashtags</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={form.useTrendingTopics}
                  onChange={(e) => onFormChange({ useTrendingTopics: e.target.checked })}
                  className="accent-blue-500 scale-110"
                />
                <span className="text-sm text-gray-200">📊 Use RSS Sources</span>
              </label>
            </div>
          </div>
          
          {/* Status Info */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Status</label>
            <div className="bg-gray-800 rounded-lg p-3 space-y-1">
              <div className="text-xs text-green-400">✅ Sources Active</div>
              <div className="text-xs text-blue-400">🔄 AI Model Ready</div>
              <div className="text-xs text-purple-400">⚡ Twitter API Connected</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="text-sm text-gray-300 font-medium">Quick Actions</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={onGenerate}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-gray-100 h-12 text-sm font-medium rounded-lg border border-gray-600 transition-all hover:border-gray-500"
          >
            <Bot className="h-5 w-5 mr-2" /> 
            <div className="flex flex-col items-start">
              <span>Generate</span>
              <span className="text-xs text-gray-400">Single tweet</span>
            </div>
          </Button>
          
          <Button
            onClick={onGenerateAndSchedule}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white h-12 text-sm font-medium rounded-lg transition-all"
          >
            <Send className="h-5 w-5 mr-2" /> 
            <div className="flex flex-col items-start">
              <span>Generate & Schedule</span>
              <span className="text-xs text-blue-200">Auto-schedule</span>
            </div>
          </Button>
          
          <Button
            onClick={onBulkGenerate}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white h-12 text-sm font-medium rounded-lg transition-all"
          >
            <Plus className="h-5 w-5 mr-2" /> 
            <div className="flex flex-col items-start">
              <span>Bulk Generate</span>
              <span className="text-xs text-green-200">{bulkCount} tweets</span>
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
}