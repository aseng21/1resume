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

export default function Home() {
  const [currentPDF, setCurrentPDF] = useState<{ url: string; name: string } | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

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
    <div className="flex h-screen bg-white">
      <Sidebar
        onFileSelect={handleStoredFileSelect}
        onDelete={handleDelete}
        currentFile={currentPDF?.name ?? null}
        onUploadClick={returnToUploadView}
      />
      
      <main className="flex-1 flex flex-col md:ml-80">
        {!currentPDF ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-96">
              <div
                {...getRootProps()}
                className="cursor-pointer outline-none"
                onClick={getRootProps().onClick}
              >
                <Card 
                  className={`p-8 border-2 border-dashed transition-colors ${
                    isDragActive 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-gray-200 bg-white hover:border-emerald-500'
                  }`}
                >
                  <input {...getInputProps()} id="dropzone-input" />
                  <div className="flex flex-col items-center gap-4">
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
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
                <p className="text-sm text-gray-500 mt-1">Upload your résumé and get AI-powered insights</p>
              </div>
              <Button 
                variant="outline" 
                className="border-gray-200 text-emerald-700 hover:bg-emerald-50"
                onClick={returnToUploadView}
              >
                Upload New Resume
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Job Description and Analysis */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  {/* Top Section - Job Description */}
                  <div className="p-6 h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label htmlFor="jobDescription" className="text-lg font-semibold text-gray-900">
                          Job Description
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Paste the job description to analyze your résumé against
                        </p>
                      </div>
                    </div>
                    <Textarea
                      id="jobDescription"
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="flex-1 resize-none border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg"
                    />
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing || !currentPDF}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="border-t border-gray-100">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <ResumeTemplates />
                </div>
              </div>

              {/* Right Side - Resume Upload and Preview */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  {/* Top Section - Upload */}
                  <div className="p-6 h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label htmlFor="upload-zone" className="text-lg font-semibold text-gray-900">
                          Your Résumé
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Upload your résumé in PDF format
                        </p>
                      </div>
                    </div>
                    <div
                      {...getRootProps()}
                      className="flex-1 border-2 border-dashed rounded-xl text-center cursor-pointer hover:border-emerald-500 transition-all duration-200 flex items-center justify-center group"
                    >
                      <input {...getInputProps()} id="upload-zone" />
                      {currentPDF ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-2 text-emerald-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="font-medium">PDF Uploaded</span>
                          </div>
                          <p className="text-sm text-gray-600">{currentPDF.name}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={returnToUploadView}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove PDF
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors duration-200">
                            <Upload className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-900">
                              Drop your résumé here
                            </p>
                            <p className="text-sm text-gray-500">
                              or click to browse files
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Section - PDF Preview */}
                  {currentPDF && (
                    <div className="border-t border-gray-100">
                      <ResumeViewer pdfUrl={currentPDF.url} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
