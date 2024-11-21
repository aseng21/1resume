import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';
import 'pdfjs-dist/build/pdf.worker.min.mjs';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLib.PDFWorker ? pdfjsLib.PDFWorker.workerSrc : undefined;
}

interface ParsedPDFContent {
  personalInfo: string;
  workExperience: string[];
  education: string[];
  skills: string[];
  certifications: string[];
}

export async function parsePDFContent(pdfBlob: Blob, originalFilename: string): Promise<ParsedPDFContent> {
  try {
    // Extract UUID from filename (format: originalname-uuid-timestamp.pdf)
    const parts = originalFilename.split('-');
    if (parts.length < 2) {
      throw new Error('Invalid filename format');
    }
    const uuid = parts[parts.length - 2]; // Get the UUID part
    
    // Convert blob to ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // Load and parse PDF directly
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter(item => 'str' in item)
        .map(item => (item as { str: string }).str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    const parsedContent: ParsedPDFContent = {
      personalInfo: extractPersonalInfo(fullText),
      workExperience: extractWorkExperience(fullText),
      education: extractEducation(fullText),
      skills: extractSkills(fullText),
      certifications: extractCertifications(fullText)
    };

    // Cache parsed content
    await cacheParseResults(uuid, parsedContent);

    return parsedContent;
  } catch (error) {
    console.error('PDF Parsing Error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractPersonalInfo(text: string): string {
  // Basic extraction of potential personal info
  const nameMatch = text.match(/^[A-Z][a-z]+ [A-Z][a-z]+/);
  const contactMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  
  return [
    nameMatch ? `Name: ${nameMatch[0]}` : '',
    contactMatch ? `Contact: ${contactMatch[0]}` : ''
  ].filter(Boolean).join('\n');
}

function extractWorkExperience(text: string): string[] {
  // Basic work experience extraction
  const workExperienceRegex = /(?:Job|Position|Role):\s*(.+?)(?:\n|$)/gi;
  const matches = text.matchAll(workExperienceRegex);
  return Array.from(matches).map(match => match[1]).slice(0, 5);
}

function extractEducation(text: string): string[] {
  // Basic education extraction
  const educationRegex = /(?:Degree|University|College):\s*(.+?)(?:\n|$)/gi;
  const matches = text.matchAll(educationRegex);
  return Array.from(matches).map(match => match[1]).slice(0, 3);
}

function extractSkills(text: string): string[] {
  // Basic skills extraction
  const skillsRegex = /(?:Skills?|Expertise):\s*(.+?)(?:\n|$)/gi;
  const matches = text.matchAll(skillsRegex);
  return Array.from(matches).map(match => match[1]).slice(0, 10);
}

function extractCertifications(text: string): string[] {
  // Basic certifications extraction
  const certRegex = /(?:Certification|Certificate):\s*(.+?)(?:\n|$)/gi;
  const matches = text.matchAll(certRegex);
  return Array.from(matches).map(match => match[1]).slice(0, 5);
}

async function cacheParseResults(uuid: string, content: ParsedPDFContent): Promise<void> {
  try {
    const cache = await caches.open('pdf-storage');
    const timestamp = Date.now();
    const filename = `parsed-${uuid}-${timestamp}.txt`;
    
    // Create a formatted text representation of parsed content
    const formattedContent = `Personal Info:\n${content.personalInfo}\n\n` +
      `Work Experience:\n${content.workExperience.join('\n')}\n\n` +
      `Education:\n${content.education.join('\n')}\n\n` +
      `Skills:\n${content.skills.join('\n')}\n\n` +
      `Certifications:\n${content.certifications.join('\n')}`;

    const response = new Response(formattedContent, {
      headers: { 
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

    await cache.put(`/parsed/${filename}`, response);
  } catch (error) {
    console.error('Error caching parse results:', error);
  }
}

export async function retrieveParsedContent(uuid: string): Promise<ParsedPDFContent | null> {
  try {
    const cache = await caches.open('pdf-storage');
    const keys = await cache.keys();
    
    // Find the most recent parsed file for this UUID
    const matchingFiles = keys
      .filter(key => key.url.includes(`/parsed/`) && key.url.includes(`-${uuid}-`))
      .sort((a, b) => {
        const extractTimestamp = (url: string) => {
          const match = url.match(/-(\d+)\.txt$/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return extractTimestamp(b.url) - extractTimestamp(a.url);
      });

    if (matchingFiles.length === 0) return null;

    const response = await cache.match(matchingFiles[0]);
    if (!response) return null;

    const text = await response.text();
    const sections = text.split('\n\n');
    
    return {
      personalInfo: sections[0].replace('Personal Info:\n', '').trim(),
      workExperience: sections[1].replace('Work Experience:\n', '').trim().split('\n'),
      education: sections[2].replace('Education:\n', '').trim().split('\n'),
      skills: sections[3].replace('Skills:\n', '').trim().split('\n'),
      certifications: sections[4].replace('Certifications:\n', '').trim().split('\n')
    };
  } catch (error) {
    console.error('Error retrieving parsed content:', error);
    return null;
  }
}
