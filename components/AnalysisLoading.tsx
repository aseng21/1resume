import { Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AnalysisLoading() {
  return (
    <Card className="p-6 border-gray-200 bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Brain className="h-12 w-12 text-emerald-600 animate-pulse" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Analyzing Resume</h3>
          <p className="text-sm text-gray-500">
            Our AI is carefully reviewing your resume against the job description...
          </p>
        </div>
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-1">
          <div className="bg-emerald-600 h-1 rounded-full animate-progress"></div>
        </div>
      </div>
    </Card>
  );
}
