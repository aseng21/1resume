'use client';

import { useState, useRef, useContext } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'react-toastify';
import { ParsedPDFContext } from '@/lib/ParsedPDFContext';
import { generateSWELatexFromAI } from '@/lib/templates/swe';

// query types for different analysis modes
type QueryType = 'analyze-gaps' | 'optimize-resume';

const gapAnalysisSystemPrompt = 'gap-analysis';
const SWE_ANALYSIS_PROMPT = 'optimize';

export default function SambaNovaDebug() {
  const [customPrompt, setCustomPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryType, setQueryType] = useState<QueryType>('analyze-gaps');
  const [latex, setLatex] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
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
    setLatex(null);
    setPdfUrl('');

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
      let parsedResponse;
      try {
        if (typeof data.response === 'object') {
          parsedResponse = data.response;
        } else {
          parsedResponse = JSON.parse(data.response);
        }

        if (parsedResponse.optimized_resume) {
          parsedResponse = parsedResponse.optimized_resume;
        }

        setResponse(JSON.stringify(parsedResponse, null, 2));
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        setResponse(data.response);
        throw new Error('Failed to parse AI response');
      }
      
      try {
        console.log('Attempting to generate LaTeX with parsed response:', parsedResponse);
        const { texDoc } = await generateSWELatexFromAI(parsedResponse);
        console.log('LaTeX generated successfully');
        setLatex(texDoc);
        
        const pdfResponse = await fetch('/api/latex/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ latex: texDoc }),
        });

        if (!pdfResponse.ok) {
          throw new Error('Failed to render PDF');
        }

        const blob = await pdfResponse.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        
        // Show success message
        toast.success('LaTeX generated successfully', {
          toastId: 'latex-success',
          containerId: 'main-toast'
        });
        toast.success('PDF rendered successfully!', {
          toastId: 'pdf-success',
          containerId: 'main-toast'
        });
      } catch (latexError) {
        console.error('Failed to generate LaTeX:', latexError);
        toast.error('Failed to generate LaTeX: ' + (latexError instanceof Error ? latexError.message : 'Unknown error'), {
          toastId: 'latex-error',
          containerId: 'main-toast'
        });
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
    setLatex(null);
    setPdfUrl('');

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
      let parsedResponse;
      try {
        if (typeof data.response === 'object') {
          parsedResponse = data.response;
        } else {
          parsedResponse = JSON.parse(data.response);
        }

        if (parsedResponse.optimized_resume) {
          parsedResponse = parsedResponse.optimized_resume;
        }

        setResponse(JSON.stringify(parsedResponse, null, 2));
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        setResponse(data.response);
        throw new Error('Failed to parse AI response');
      }
      
      try {
        console.log('Attempting to generate LaTeX with parsed response:', parsedResponse);
        const { texDoc } = await generateSWELatexFromAI(parsedResponse);
        console.log('LaTeX generated successfully');
        setLatex(texDoc);
        
        // PDF
        const pdfResponse = await fetch('/api/latex/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ latex: texDoc }),
        });

        if (!pdfResponse.ok) {
          throw new Error('Failed to render PDF');
        }

        const blob = await pdfResponse.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        
        // success message
        toast.success('LaTeX generated successfully', {
          toastId: 'latex-success',
          containerId: 'main-toast'
        });
        toast.success('PDF rendered successfully!', {
          toastId: 'pdf-success',
          containerId: 'main-toast'
        });
      } catch (latexError) {
        console.error('Failed to generate LaTeX:', latexError);
        toast.error('Failed to generate LaTeX: ' + (latexError instanceof Error ? latexError.message : 'Unknown error'), {
          toastId: 'latex-error',
          containerId: 'main-toast'
        });
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

  const handleLatexGeneration = async () => {
    try {
      if (!parsedPDFContent) {
        toast.error('No resume data available');
        return;
      }

      // original resume data to the gap analysis response
      const resumeData = {
        ...parsedPDFContent,
        original_resume: JSON.parse(textareaRef.current?.value || '{}')
      };

      console.log('Resume data:', resumeData);
      const latexResult = await generateSWELatexFromAI(resumeData);
      setLatex(latexResult.texDoc);
      
      // PDF
      const pdfResponse = await fetch('/api/latex/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          latex: latexResult.texDoc,
          packages: [
            'latexsym',
            'fullpage',
            'titlesec',
            'marvosym',
            'xcolor',
            'verbatim',
            'enumitem',
            'hyperref',
            'fancyhdr',
            'babel',
            'tabularx',
            'fontawesome5',
            'multicol'
          ]
        }),
      });

      if (!pdfResponse.ok) {
        const error = await pdfResponse.text();
        throw new Error(`Failed to render PDF: ${error}`);
      }

      const blob = await pdfResponse.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      toast.success('LaTeX generated successfully!');
      toast.success('PDF rendered successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate resume');
    }
  };

  const copyToClipboard = () => {
    if (latex) {
      navigator.clipboard.writeText(latex)
        .then(() => toast.success('LaTeX copied to clipboard!'))
        .catch(() => toast.error('Failed to copy LaTeX'));
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
        <Button 
          onClick={handleLatexGeneration}
          disabled={isLoading || !parsedPDFContent}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          Generate LaTeX
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
      {latex && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-900">LaTeX Output:</h3>
            <Button
              onClick={copyToClipboard}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              size="sm"
            >
              Copy LaTeX
            </Button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
            {latex}
          </pre>
        </div>
      )}
      {pdfUrl && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-900 mb-2">PDF Preview:</h3>
          <iframe
            src={pdfUrl}
            className="w-full h-[800px] border border-gray-200 rounded-md"
            title="Resume PDF Preview"
          />
        </div>
      )}
    </Card>
  );
}
