'use client';
import { useState } from 'react';

const LATEX_TO_PDF_URL = 'https://latex-to-pdf-moqypekqyq-uc.a.run.app';
const SCRAPE_JOBS_URL = 'https://scrape-jobs-moqypekqyq-uc.a.run.app';

export default function TestPage() {
  const [latexInput, setLatexInput] = useState('\\documentclass{article}\n\\begin{document}\nHello, World!\n\\end{document}');
  const [jobUrls, setJobUrls] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const testLatexToPdf = async () => {
    setLoading(true);
    setPdfUrl(null);
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      setPdfUrl(url);
      setResponse('PDF generated successfully');
    } catch (error) {
      console.error('Error:', error);
      setResponse(`LaTeX to PDF Response: ${JSON.stringify(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testJobScraper = async () => {
    setLoading(true);
    setPdfUrl(null);
    try {
      const urls = jobUrls.split('\n').filter(url => url.trim());
      const response = await fetch(SCRAPE_JOBS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          urls: urls,
          prompt: "Extract job details"
        }),
      });

      const data = await response.json();
      setResponse(`Job Scraper Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Error:', error);
      setResponse(`Job Scraper Response: ${JSON.stringify(error.message || error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Firebase Functions</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Test LaTeX to PDF</h2>
        <textarea
          value={latexInput}
          onChange={(e) => setLatexInput(e.target.value)}
          className="w-full h-32 p-2 border rounded mb-2"
          placeholder="Enter LaTeX content..."
        />
        <div className="flex gap-2">
          <button
            onClick={testLatexToPdf}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              View PDF
            </a>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Test Job Scraper</h2>
        <textarea
          value={jobUrls}
          onChange={(e) => setJobUrls(e.target.value)}
          className="w-full h-32 p-2 border rounded mb-2"
          placeholder="Enter job URLs (one per line)..."
        />
        <button
          onClick={testJobScraper}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Scraping...' : 'Scrape Jobs'}
        </button>
      </div>

      {response && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
