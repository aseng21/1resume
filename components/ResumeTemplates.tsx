'use client';

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import Image from 'next/image';
import { generateSWELatex } from '@/lib/templates/swe';
import { toast } from 'react-toastify';

const templates = [
  { id: 'swe1', name: 'Software Engineer', path: '/1Resume-SWE1.webp', available: true },
  { id: 'pm1', name: 'Product Manager', path: '/1Resume-SWE2.webp', available: false },
  { id: 'data1', name: 'Data Scientist', path: '/1Resume-SWE3.png', available: false },
  { id: 'ux1', name: 'UX Designer', path: '/1Resume-SWE4.png', available: false },
  { id: 'mec1', name: 'Mechanical Engineer', path: '/1Resume-MEC1.webp', available: false },
  { id: 'teacher1', name: 'Teacher', path: '/1Resume-Teacher1.webp', available: false },
];

const descriptions = {
  swe1: 'Enter your job description below!',
  pm1: 'Enter your job description below!',
  data1: 'Enter your job description below!',
  ux1: 'Enter your job description below!',
  mec1: 'Enter your job description below!',
  teacher1: 'Enter your job description below!',
};

export default function ResumeTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTemplateClick = (templateId: string, available: boolean) => {
    if (!available) return;
    setSelectedTemplate(templateId);
  };

  const handleOptimize = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please enter a job description to tailor your resume', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

    setIsLoading(true);
    const optimizingToast = toast.loading('Optimizing your resume with AI...', {
      position: 'bottom-right',
    });

    try {
      const response = await fetch('/api/sambanova', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedTemplate,
          jobDescription: jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize resume');
      }

      const data = await response.json();
      toast.update(optimizingToast, {
        render: 'Generating PDF...',
        type: 'info',
        isLoading: true,
      });
      
      const latex = generateSWELatex(data);

      const pdfResponse = await fetch('/api/latex/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(latex),
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.update(optimizingToast, {
        render: 'Resume optimized and downloaded successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 5000,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.update(optimizingToast, {
        render: 'Failed to optimize resume. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Resume Templates</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a template that best fits your experience</p>
        </div>
        {selectedTemplate && (
          <button
            onClick={() => setSelectedTemplate(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Selection
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        {templates.map((template) => (
          <div key={template.id} className="space-y-2">
            <div className="relative" style={{ perspective: '1000px' }}>
              <div
                className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-200 bg-white transform-gpu ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-emerald-500 shadow-lg scale-[1.02]' 
                    : template.available ? 'hover:ring-4 hover:ring-emerald-100 hover:shadow-lg hover:scale-[1.02]' : 'grayscale'
                }`}
                onClick={() => handleTemplateClick(template.id, template.available)}
              >
                {!template.available && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10">
                    <span className="text-white text-xl font-bold">Coming Soon</span>
                  </div>
                )}
                <div className="aspect-[3/4] relative">
                  <Image
                    src={template.path}
                    alt={template.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, 40vw"
                    priority
                  />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-base">
                      {template.name}
                    </span>
                    <span className={`w-5 h-5 ${selectedTemplate === template.id ? 'text-emerald-400' : 'opacity-0'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {selectedTemplate === template.id && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  {descriptions[template.id as keyof typeof descriptions]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label htmlFor="job-description" className="block text-lg font-bold text-gray-700 mb-2">
              Job Description
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Paste the job description here to optimize your resume for this specific role
            </p>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[200px] resize-none"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleOptimize}
            disabled={isLoading || !jobDescription.trim()}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                <span>Optimizing Resume...</span>
              </>
            ) : (
              'Optimize Resume'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
