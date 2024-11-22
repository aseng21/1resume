'use client';

import { useState, useContext } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ParsedPDFContext } from '@/lib/ParsedPDFContext';

export default function SambaNovaDebug() {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const { parsedPDFContent } = useContext(ParsedPDFContext);

  const [queryType, setQueryType] = useState<'optimize' | 'analyze-gaps'>('optimize');

  const handleQuery = async (type: 'optimize' | 'analyze-gaps') => {
    if (!parsedPDFContent?.rawText) {
      setResponse('No PDF content available');
      return;
    }

    setIsLoading(true);
    setQueryType(type);
    try {
      const fullPrompt = customPrompt 
        ? `Job Listing:\n${customPrompt}\n\nCandidate Resume:\n${parsedPDFContent.rawText}` 
        : parsedPDFContent.rawText;

      const response = await fetch('/api/sambanova', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          systemPrompt: type === 'analyze-gaps' ? 'gap-analysis' : undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `Error: ${data.error}\nDetails: ${JSON.stringify(data.details, null, 2)}` 
          : data.error || 'Unknown error occurred';
        
        setResponse(errorMessage);
        throw new Error(errorMessage);
      }

      setResponse(data.response);
    } catch (error) {
      console.error('Error in SambaNova query:', error);
      setResponse(error instanceof Error ? error.message : 'Error querying SambaNova');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 border-gray-200 bg-white mt-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">SambaNova Debug</h2>
      <Textarea 
        placeholder="Job Listing"
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        className="mb-4 border-gray-200 focus:ring-emerald-500"
      />
      <div className="flex space-x-4 mb-4">
        <Button 
          onClick={() => handleQuery('optimize')} 
          disabled={isLoading || !parsedPDFContent}
          className={`flex-1 ${queryType === 'optimize' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-200 text-gray-700'} text-white`}
        >
          {isLoading && queryType === 'optimize' ? 'Optimizing...' : 'Optimize Resume'}
        </Button>
        <Button 
          onClick={() => handleQuery('analyze-gaps')} 
          disabled={isLoading || !parsedPDFContent}
          className={`flex-1 ${queryType === 'analyze-gaps' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-200 text-gray-700'} text-white`}
        >
          {isLoading && queryType === 'analyze-gaps' ? 'Analyzing Gaps...' : 'Analyze Resume Gaps'}
        </Button>
      </div>
      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Response:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </Card>
  );
}
