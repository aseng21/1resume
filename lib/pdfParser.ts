import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ParsedPDFContent {
  personalInfo: string;
  workExperience: string[];
  education: string[];
  skills: string[];
  certifications: string[];
}

export async function parsePDFContent(pdfBlob: Blob, originalFilename: string): Promise<ParsedPDFContent> {
  try {
    // Extract UUID from filename
    const uuid = originalFilename.split('-')[1];
    
    // Load PDF
    const pdf = await pdfjsLib.getDocument(await pdfBlob.arrayBuffer()).promise;
    
    // Extract text from all pages
    const textContent: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const pageTextContent = await page.getTextContent();
      const pageText = pageTextContent.items.map(item => 'str' in item ? item.str : '').join(' ');
      textContent.push(pageText);
    }
    
    // Basic parsing (can be enhanced with more sophisticated logic)
    const fullText = textContent.join('\n');
    
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
    throw error;
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
    const cache = await caches.open('pdf-parse-results');
    const cacheKey = `/parsed-pdfs/${uuid}.json`;
    
    const response = new Response(JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json' }
    });

    await cache.put(cacheKey, response);
  } catch (error) {
    console.error('Error caching parse results:', error);
  }
}

export async function retrieveParsedContent(uuid: string): Promise<ParsedPDFContent | null> {
  try {
    const cache = await caches.open('pdf-parse-results');
    const response = await cache.match(`/parsed-pdfs/${uuid}.json`);
    
    if (!response) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Error retrieving parsed content:', error);
    return null;
  }
}
