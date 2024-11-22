'use client';

import React, { createContext, useState, ReactNode } from 'react';

interface ParsedPDFContent {
  rawText: string;
  lines: string[];
}

interface ParsedPDFContextType {
  parsedPDFContent: ParsedPDFContent | null;
  setParsedPDFContent: (content: ParsedPDFContent | null) => void;
}

export const ParsedPDFContext = createContext<ParsedPDFContextType>({
  parsedPDFContent: null,
  setParsedPDFContent: () => {},
});

export const ParsedPDFProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [parsedPDFContent, setParsedPDFContent] = useState<ParsedPDFContent | null>(null);

  return (
    <ParsedPDFContext.Provider value={{ parsedPDFContent, setParsedPDFContent }}>
      {children}
    </ParsedPDFContext.Provider>
  );
};
