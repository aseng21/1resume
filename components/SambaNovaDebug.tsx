'use client';

import { useState, useRef, useContext } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'react-toastify';
import { ParsedPDFContext } from '@/lib/ParsedPDFContext';

// query types for different analysis modes
type QueryType = 'analyze-gaps' | 'optimize-resume';

const gapAnalysisSystemPrompt = 'gap-analysis';
const SWE_ANALYSIS_PROMPT = 'optimize';

export default function SambaNovaDebug() {
  const [customPrompt, setCustomPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryType, setQueryType] = useState<QueryType>('analyze-gaps');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { parsedPDFContent } = useContext(ParsedPDFContext);

  // analyze gaps in resume compared to job description
  const handleGapAnalysis = async () => {
    if (!parsedPDFContent?.rawText) {
      setResponse('No PDF content available');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      const response = await fetch('/api/sambanova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: 'Analyze resume gaps against job description',
          systemPrompt: gapAnalysisSystemPrompt,
          additionalContext: {
            jobListing: customPrompt || '',
            resumeContent: parsedPDFContent.rawText
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze resume');
      }

      const data = await response.json();
      
      // try to parse and format the JSON response
      try {
        const parsedResponse = JSON.parse(data.response);
        setResponse(JSON.stringify(parsedResponse, null, 2));
      } catch {
        setResponse(data.response);
      }
      
      toast.success('Gap analysis completed', {
        toastId: 'gap-analysis-success',
        containerId: 'main-toast'
      });
    } catch (error) {
      console.error('Error in gap analysis:', error);
      setResponse(error instanceof Error ? error.message : 'Error analyzing gaps');
      
      toast.error('Failed to analyze gaps', {
        toastId: 'gap-analysis-error',
        containerId: 'main-toast'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // optimize resume for job description
  const handleOptimize = async () => {
    if (!parsedPDFContent?.rawText) {
      setResponse('No PDF content available');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      const response = await fetch('/api/sambanova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: 'Optimize resume for job description',
          systemPrompt: SWE_ANALYSIS_PROMPT,
          additionalContext: {
            jobListing: customPrompt || '',
            resumeContent: parsedPDFContent.rawText
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize resume');
      }

      const data = await response.json();
      
      // try to parse and format the JSON response
      try {
        const parsedResponse = JSON.parse(data.response);
        setResponse(JSON.stringify(parsedResponse, null, 2));
      } catch {
        setResponse(data.response);
      }
      
      toast.success('Resume optimization completed', {
        toastId: 'optimize-success',
        containerId: 'main-toast'
      });
    } catch (error) {
      console.error('Error in resume optimization:', error);
      setResponse(error instanceof Error ? error.message : 'Error optimizing resume');
      
      toast.error('Failed to optimize resume', {
        toastId: 'optimize-error',
        containerId: 'main-toast'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 border-gray-200 bg-white mt-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">SambaNova Debug</h2>
      <Textarea 
        ref={textareaRef}
        placeholder="Enter job description or custom prompt..."
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        className="min-h-[100px] mb-4"
      />
      <div className="flex flex-col space-y-2">
        <Button 
          onClick={() => {
            setQueryType('analyze-gaps');
            handleGapAnalysis();
          }}
          disabled={isLoading || !parsedPDFContent}
          className={`w-full ${queryType === 'analyze-gaps' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
        >
          {isLoading && queryType === 'analyze-gaps' ? 'Analyzing Gaps...' : 'Analyze Resume Gaps'}
        </Button>
        <Button 
          onClick={() => {
            setQueryType('optimize-resume');
            handleOptimize();
          }}
          disabled={isLoading || !parsedPDFContent}
          className={`w-full ${queryType === 'optimize-resume' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}
        >
          {isLoading && queryType === 'optimize-resume' ? 'Optimizing...' : 'Optimize Resume'}
        </Button>
      </div>
      {response && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-900 mb-2">Response:</h3>
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
            {response}
          </pre>
        </div>
      )}
    </Card>
  );
}
