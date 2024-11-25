'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { storePDF, loadPDF, deletePDF } from '@/lib/pdfStorage';
import { retrieveParsedContent } from '@/lib/pdfParser';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '@/components/Sidebar';
import { Upload } from 'lucide-react';
import AnalysisLoading from '@/components/AnalysisLoading';
import ResumeViewer from '@/components/ResumeViewer';
import '@/lib/pdfjs';
import ResumeTemplates from '@/components/ResumeTemplates';
import { ParsedPDFContext } from '@/lib/ParsedPDFContext';
import cn from 'classnames';
import Image from 'next/image';
import SambaNovaDebug from '@/components/SambaNovaDebug';

export default function Home() {
  const [currentPDF, setCurrentPDF] = useState<{ url: string; name: string } | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    return () => {
      if (currentPDF?.url) {
        URL.revokeObjectURL(currentPDF.url);
      }
    };
  }, [currentPDF]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      // Create blob URL for preview
      const url = URL.createObjectURL(file);
      setCurrentPDF({ url, name: file.name });

      // Store PDF
      await storePDF(file);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error('Error processing PDF');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false,
    noClick: false,
    noKeyboard: false,
    preventDropOnDocument: true
  });

  const { setParsedPDFContent } = useContext(ParsedPDFContext);

  const handleStoredFileSelect = async (filename: string) => {
    try {
      if (currentPDF?.url) {
        URL.revokeObjectURL(currentPDF.url);
      }

      const pdfBlob = await loadPDF(filename);
      if (!pdfBlob) {
        throw new Error('Failed to load PDF from storage');
      }

      // Extract UUID from filename
      const parts = filename.split('-');
      const uuid = parts[parts.length - 2];

      // Retrieve parsed content
      const parsedContent = await retrieveParsedContent(uuid);
    
      if (parsedContent) {
        // Set parsed content in context
        setParsedPDFContent(parsedContent);
        console.log('Loaded Parsed PDF Content:', {
          rawTextLength: parsedContent.rawText.length,
          linesCount: parsedContent.lines.length
        });
      } else {
        // Clear parsed content if not found
        setParsedPDFContent(null);
      }

      const url = URL.createObjectURL(pdfBlob);
      setCurrentPDF({ url, name: filename });
    } catch (error) {
      console.error('Error loading stored PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load PDF', {
        toastId: 'pdf-load-error',
        containerId: 'main-toast'
      });
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const success = await deletePDF(filename);
      if (!success) {
        throw new Error('Failed to delete PDF');
      }

      if (currentPDF?.name === filename) {
        if (currentPDF.url) {
          URL.revokeObjectURL(currentPDF.url);
        }
        setCurrentPDF(null);
        setJobDescription('');
        setAnalysisResult('');
      }

      toast.success('Resume deleted successfully', {
        toastId: 'resume-delete',
        containerId: 'main-toast'
      });
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete PDF', {
        toastId: 'resume-delete-error',
        containerId: 'main-toast'
      });
    }
  };

  const handleAnalyze = async () => {
    if (!currentPDF) {
      toast.error('Please upload a resume first', {
        toastId: 'analyze-error',
        containerId: 'main-toast'
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please enter a job description', {
        toastId: 'job-description-error',
        containerId: 'main-toast'
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // TODO: Implement LAMA model stuff
      setAnalysisResult('Analysis will be implemented soon...');
      toast.success('Analysis completed', {
        toastId: 'analysis-success',
        containerId: 'main-toast'
      });
    } catch {
      toast.error('Failed to analyze resume', {
        toastId: 'analysis-error',
        containerId: 'main-toast'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const returnToUploadView = () => {
    if (currentPDF?.url) {
      URL.revokeObjectURL(currentPDF.url);
    }
    setCurrentPDF(null);
    setJobDescription('');
    setAnalysisResult('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        onFileSelect={handleStoredFileSelect}
        onDelete={handleDelete}
        currentFile={currentPDF?.name || null}
        onUploadClick={returnToUploadView}
        onSidebarToggle={setIsSidebarOpen}
      />
      <main className={cn(
        "transition-all duration-200 ease-in-out",
        isSidebarOpen ? "md:pl-72" : "md:pl-6",
        "pt-14 md:pt-4 px-4 md:pr-6"
      )}>
        {!currentPDF ? (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="w-96">
              <div
                {...getRootProps()}
                className="cursor-pointer outline-none"
                onClick={getRootProps().onClick}
              >
                <Card 
                  className={` p-8 border-2 border-dashed transition-colors${
                    isDragActive 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-gray-200 bg-white hover:border-emerald-500'
                  }`}
                >
                  <input {...getInputProps()} id="dropzone-input" />
                  <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <div className="p-4 rounded-full bg-emerald-50">
                      <Upload className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Upload Resume</h2>
                    <p className="text-sm text-gray-500 text-center">
                      {isDragActive
                        ? 'Drop your resume here...'
                        : 'Drag and drop your resume here or click to choose a PDF file'}
                    </p>
                    <Button 
                      type="button"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Choose PDF File
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resume Analysis</h1>
                <p className="text-sm text-gray-500 mt-2">Upload your résumé and get AI-powered insights</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none border-gray-200 text-emerald-700 hover:bg-emerald-50 font-medium"
                  onClick={returnToUploadView}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Resume
                </Button>
                {currentPDF && (
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-gray-200 text-red-600 hover:bg-red-50 font-medium group relative"
                    onClick={() => handleDelete(currentPDF.name)}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="truncate">Remove PDF</span>
                    {/* Tooltip for long filenames */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {currentPDF.name}
                    </div>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Job Description and Analysis */}
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Top Section - Job Description */}
                  <div className="p-6 h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label htmlFor="job-description" className="text-lg font-semibold text-gray-900">
                          Job Description
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Paste the job description to analyze
                        </p>
                      </div>
                    </div>
                    <Textarea
                      id="job-description"
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="flex-1 resize-none border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg"
                    />
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing || !currentPDF}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </div>
                      ) : (
                        <span>Analyze Resume</span>
                      )}
                    </Button>
                  </div>

                  {/* Bottom Section - Analysis Results */}
                  {(isAnalyzing || analysisResult) && (
                    <div className="border-t border-gray-200">
                      {isAnalyzing ? (
                        <div className="p-6">
                          <AnalysisLoading />
                        </div>
                      ) : analysisResult && (
                        <div className="p-6">
                          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
                          <div className="prose prose-sm max-w-none text-gray-600">
                            {analysisResult}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Resume Templates */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <ResumeTemplates />
                </div>
              </div>

              {/* Right Side - Resume Upload and Preview */}
              <div className="h-full flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1">
                  {/* Top Section - Upload */}
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center mt-2">
                        <Label htmlFor="upload-zone" className="text-lg font-semibold text-gray-900">
                          Your Résumé
                        </Label>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Upload your résumé in PDF format
                      </p>
                    </div>
                    {currentPDF ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                          <svg className="w-5 h-5 shrink-0 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span className="font-medium text-emerald-700 break-all line-clamp-2 text-sm">
                            {currentPDF.name}
                          </span>
                        </div>
                        <ResumeViewer pdfUrl={currentPDF.url} />
                      </div>
                    ) : (
                      <div
                        {...getRootProps()}
                        className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:border-emerald-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100/50"
                      >
                        <input {...getInputProps()} id="upload-zone" />
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Upload className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-900 mb-1">
                              Drop your résumé here
                            </p>
                            <p className="text-sm text-gray-500">
                              or click to browse files
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {setParsedPDFContent && (
              <SambaNovaDebug />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
