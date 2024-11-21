import pdfToText from 'react-pdftotext';

interface ParsedPDFContent {
  rawText: string;
  lines: string[];
}

export async function parsePDFContent(pdfBlob: Blob, originalFilename: string): Promise<ParsedPDFContent> {
  try {
    // Validate input
    if (!pdfBlob) {
      throw new Error('No PDF blob provided');
    }

    // Check blob size and type
    console.log('PDF Blob Size:', pdfBlob.size);
    console.log('PDF Blob Type:', pdfBlob.type);

    if (pdfBlob.size === 0) {
      throw new Error('Empty PDF file');
    }

    // Convert PDF to text with additional error handling
    let rawText: string;
    try {
      rawText = await pdfToText(pdfBlob);
    } catch (extractError) {
      console.error('PDF Text Extraction Error:', extractError);
      throw new Error(`Failed to extract text from PDF: ${extractError instanceof Error ?  extractError.message : 'Unknown extraction error'}`);
    }

    // Validate extracted text
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('No text extracted from PDF');
    }
    
    // Split into meaningful lines, removing empty lines
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Validate lines
    if (lines.length === 0) {
      throw new Error('No non-empty lines found in PDF');
    }

    const parsedContent = {
      rawText,
      lines
    };

    // Cache the results
    const parts = originalFilename.split('-');
    if (parts.length >= 2) {
      const uuid = parts[parts.length - 2];
      await cacheParseResults(uuid, parsedContent);
    }

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

async function cacheParseResults(uuid: string, content: ParsedPDFContent): Promise<void> {
  try {
    const cache = await caches.open('pdf-storage');
    const timestamp = Date.now();
    const filename = `parsed-${uuid}-${timestamp}.txt`;
    
    const response = new Response(content.rawText, {
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
    
    return {
      rawText: text,
      lines: text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    };
  } catch (error) {
    console.error('Error retrieving parsed content:', error);
    return null;
  }
}
