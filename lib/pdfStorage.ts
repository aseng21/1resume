

import { v4 as uuidv4 } from 'uuid';
import { parsePDFContent } from './pdfParser';

export async function storePDF(file: File): Promise<string> {
  try {
    // validation
    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }

    const cache = await caches.open('pdf-storage');
    const uid = uuidv4();
    const timestamp = Date.now();
    const filename = `${file.name}-${uid}-${timestamp}.pdf`;
    
    const pdfResponse = new Response(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'  
      },
    });

    // Store the PDF file
    await cache.put(`/pdfs/${filename}`, pdfResponse.clone());

    // Parse and cache PDF content
    try {
      const parsedContent = await parsePDFContent(file, filename);
      console.log('PDF parsed and cached:', filename); // Add logging for debugging
    } catch (parseError) {
      console.error('Error parsing PDF:', parseError);
      throw new Error('Failed to parse PDF content');
    }

    return filename;
  } catch (error) {
    console.error('Error storing PDF:', error);
    throw error;
  }
}

export async function loadPDF(filename: string): Promise<Blob | null> {
  try {
    const cache = await caches.open('pdf-storage');
    const response = await cache.match(`/pdfs/${filename}`);
    
    if (!response) {
      throw new Error('PDF not found in storage');
    }

    const blob = await response.blob();
    if (!blob || blob.type !== 'application/pdf') {
      throw new Error('Invalid file type in storage');
    }

    return blob;
  } catch (error) {
    console.error('Error loading PDF:', error);
    return null;
  }
}

export async function deletePDF(filename: string): Promise<boolean> {
  try {
    const cache = await caches.open('pdf-storage');
    return await cache.delete(`/pdfs/${filename}`);
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
}

export async function listStoredPDFs(): Promise<string[]> {
  try {
    const cache = await caches.open('pdf-storage');
    const requests = await cache.keys();
    return requests
      .map(request => {
        const parts = request.url.split('/');
        return parts[parts.length - 1];
      })
      .filter(name => name.endsWith('.pdf'));
  } catch (error) {
    console.error('Error listing PDFs:', error);
    return [];
  }
}

export function extractOriginalFilename(storedFilename: string): string {
  return storedFilename.split('-')[0];
}

export async function checkParsedContent(filename: string): Promise<boolean> {
  try {
    const cache = await caches.open('pdf-storage');
    const parsedResponse = await cache.match(`/parsed/${filename}`);
    return parsedResponse !== undefined;
  } catch (error) {
    console.error('Error checking parsed content:', error);
    return false;
  }
}
