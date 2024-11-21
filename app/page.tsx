'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { storePDF, loadPDF, deletePDF } from '@/lib/pdfStorage';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '@/components/Sidebar';
import { Upload } from 'lucide-react';
import AnalysisLoading from '@/components/AnalysisLoading';

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
    try {
      if (file.type !== 'application/pdf') {
        throw new Error('Please upload a PDF file');
      }

      if (currentPDF?.url) {
        URL.revokeObjectURL(currentPDF.url);
      }

      const filename = await storePDF(file);
      const storedPDF = await loadPDF(filename);
      
      if (!storedPDF) {
        throw new Error('Failed to store PDF');
      }

      const url = URL.createObjectURL(storedPDF);
      setCurrentPDF({ url, name: filename });
      toast.success('Resume uploaded successfully', {
        toastId: 'resume-upload',
        containerId: 'main-toast'
      });
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload resume', {
        toastId: 'resume-upload-error',
        containerId: 'main-toast'
      });
    }
  }, [currentPDF]);

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

  const handleStoredFileSelect = async (filename: string) => {
    try {
      if (currentPDF?.url) {
        URL.revokeObjectURL(currentPDF.url);
      }

      const pdfBlob = await loadPDF(filename);
      if (!pdfBlob) {
        throw new Error('Failed to load PDF from storage');
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
              <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
              <Button 
                variant="outline" 
                className="border-gray-200 text-emerald-700 hover:bg-emerald-50"
                onClick={returnToUploadView}
              >
                Upload New Resume
              </Button>
            </div>

            <Card className="p-6 border-gray-200 bg-white">
              <Label htmlFor="jobDescription" className="text-gray-900">
                Job Description
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[150px] mt-2 border-gray-200 focus:ring-emerald-500"
              />
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
              </Button>
            </Card>

            {isAnalyzing ? (
              <AnalysisLoading />
            ) : analysisResult && (
              <Card className="p-6 border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
                <div className="whitespace-pre-wrap text-gray-800">{analysisResult}</div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
