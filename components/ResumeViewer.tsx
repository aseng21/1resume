'use client';

import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Plus, Minus } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import cn from 'classnames';

interface ResumeViewerProps {
  pdfUrl: string;
}

export default function ResumeViewer({ pdfUrl }: ResumeViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setScale(window.innerWidth < 768 ? 0.6 : 1);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error): void {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));

  return (
    <Card className={cn(
      "w-full mt-4",
      isMobile ? "mx-auto px-2" : "px-6"
    )}>
      <CardContent className={cn(
        "p-4 md:p-6",
        "overflow-x-hidden"
      )}>
        <div className="flex flex-col items-center">
          {loading && (
            <div className="flex items-center justify-center p-4 md:p-8">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
              <span className="ml-2 text-sm md:text-base">Loading PDF...</span>
            </div>
          )}

          {error && (
            <div className="text-red-500 p-4">
              {error}
            </div>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-4 md:p-8">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
              </div>
            }
            className="w-full max-w-3xl mx-auto"
          >
            {!loading && !error && (
              <div className="relative">
                <Page 
                  pageNumber={pageNumber} 
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="max-w-full h-auto mx-auto touch-manipulation"
                  scale={scale}
                  width={isMobile ? window.innerWidth - 32 : undefined}
                />
                
                {/* Zoom controls */}
                <div className="flex items-center justify-center gap-2 mt-4 mb-2">
                  <Button
                    onClick={handleZoomOut}
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    onClick={handleZoomIn}
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Document>

          {!loading && !error && numPages > 1 && (
            <div className="flex items-center gap-2 md:gap-4 mt-4 touch-manipulation">
              <Button
                onClick={() => setPageNumber(page => Math.max(1, page - 1))}
                disabled={pageNumber <= 1}
                variant="outline"
                size="sm"
                className="p-2 md:p-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm">
                Page {pageNumber} of {numPages}
              </span>

              <Button
                onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
                disabled={pageNumber >= numPages}
                variant="outline"
                size="sm"
                className="p-2 md:p-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
