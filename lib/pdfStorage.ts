

import { v4 as uuidv4 } from 'uuid';

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

    await cache.put(`/pdfs/${filename}`, pdfResponse.clone());
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
