'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import Image from 'next/image';

const templates = [
  { id: 'mec1', name: 'Mechanical Engineer', path: '/1Resume-MEC1.webp' },
  { id: 'swe1', name: 'Software Engineer 1', path: '/1Resume-SWE1.webp' },
  { id: 'swe2', name: 'Software Engineer 2', path: '/1Resume-SWE2.webp' },
  { id: 'swe3', name: 'Software Engineer 3', path: '/1Resume-SWE3.png' },
  { id: 'swe4', name: 'Software Engineer 4', path: '/1Resume-SWE4.png' },
  { id: 'teacher1', name: 'Teacher', path: '/1Resume-Teacher1.webp' },
];

export default function ResumeTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="relative" style={{ perspective: '1000px' }}>
            <div
              className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-200 bg-white transform-gpu ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-emerald-500 shadow-lg scale-[1.02]' 
                  : 'hover:ring-4 hover:ring-emerald-100 hover:shadow-lg hover:scale-[1.02]'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="aspect-[3/4] relative">
                <Image
                  src={template.path}
                  alt={template.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">
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
        ))}
      </div>
    </div>
  );
}
