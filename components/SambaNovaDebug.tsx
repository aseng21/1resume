'use client';

import { useState, useContext } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useEffect } from 'react';
import { ParsedPDFContext } from '@/lib/ParsedPDFContext';
import { ResumeTemplateType, getSystemPromptByType } from '@/lib/systemPrompts';

export default function SambaNovaDebug() {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Dynamic textarea resizing
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [customPrompt]);
  const { parsedPDFContent } = useContext(ParsedPDFContext);

  const [queryType, setQueryType] = useState<'optimize' | 'analyze-gaps' | ResumeTemplateType>('optimize');

  const handleQuery = async (type: 'optimize' | 'analyze-gaps' | ResumeTemplateType) => {
    if (!parsedPDFContent?.rawText) {
      setResponse('No PDF content available');
      return;
    }

    setIsLoading(true);
    setQueryType(type);
    
    // Reset response when starting a new query
    setResponse('');

    // Check if the type is a resume template type
    const isTemplateType = Object.values(ResumeTemplateType).includes(type as ResumeTemplateType);
    try {
      let prompt = 'Optimize resume for job application';
      let systemPrompt;

      if (isTemplateType) {
        const templatePrompt = getSystemPromptByType(type as ResumeTemplateType);
        prompt = 'Generate a professional LaTeX resume using the specified template';
        systemPrompt = templatePrompt.systemPrompt;
      } else {
        systemPrompt = type === 'analyze-gaps' 
          ? 'Identify skill and experience gaps' 
          : undefined;
      }

      const response = await fetch('/api/sambanova', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt,
          systemPrompt: systemPrompt,
          additionalContext: {
            jobListing: customPrompt || '',
            resumeContent: parsedPDFContent.rawText
          }
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
      <div className="flex flex-wrap space-x-2 space-y-2 mb-4">
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
        {Object.values(ResumeTemplateType).map((templateType) => (
          <Button 
            key={templateType}
            onClick={() => handleQuery(templateType)} 
            disabled={isLoading || !parsedPDFContent}
            className={`flex-1 ${queryType === templateType ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-200 text-gray-700'} text-white`}
          >
            {isLoading && queryType === templateType 
              ? `Generating ${templateType} LaTeX...` 
              : `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Resume`}
          </Button>
        ))}
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
