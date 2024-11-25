'use client';
import { useState } from 'react';

const LATEX_TO_PDF_URL = 'https://resume-functions-490809062275.us-central1.run.app/latex-to-pdf';

const DEFAULT_LATEX = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage[margin=1in]{geometry}

\\begin{document}
\\section*{Test Document}
This is a test document to verify PDF generation.

\\subsection*{Features}
\\begin{itemize}
  \\item Basic LaTeX compilation
  \\item PDF rendering
  \\item Error handling
\\end{itemize}

\\end{document}`;

export default function TestPage() {
  const [latexInput, setLatexInput] = useState(DEFAULT_LATEX);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLatexToPdf = async () => {
    setLoading(true);
    setError(null);
    setResponse('');
    try {
      const response = await fetch(LATEX_TO_PDF_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latexInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert LaTeX to PDF');
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const container = document.getElementById('pdf-container');
      if (container) {
        container.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = '100%';
        iframe.style.height = '800px';
        iframe.style.border = 'none';
        container.appendChild(iframe);
      }
      
      setResponse('PDF generated successfully');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">LaTeX to PDF Test Page</h1>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="latex-input" className="block text-sm font-medium text-gray-700 mb-2">
                  LaTeX Content
                </label>
                <textarea
                  id="latex-input"
                  value={latexInput}
                  onChange={(e) => setLatexInput(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                  spellCheck="false"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={testLatexToPdf}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate PDF'
                  )}
                </button>
                
                {response && (
                  <span className="text-sm text-green-600">
                    {response}
                  </span>
                )}
              </div>
              
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div id="pdf-container" className="mt-6 border rounded-lg bg-gray-50 min-h-[800px]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
