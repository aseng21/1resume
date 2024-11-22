import { NextRequest, NextResponse } from 'next/server';
import { getSambaNovaResponse } from '@/lib/sambanova';

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt is required',
        details: 'The request must include a non-empty prompt'
      }, { status: 400 });
    }

    try {
      // Determine system prompt based on the systemPrompt parameter
      const resolvedSystemPrompt = systemPrompt === 'gap-analysis' 
        ? undefined  // This will trigger the gap analysis system prompt in getSambaNovaResponse
        : undefined;

      const response = await getSambaNovaResponse(prompt, resolvedSystemPrompt);
      return NextResponse.json({ response });
    } catch (sambaError) {
      console.error('Detailed SambaNova API Error:', sambaError);
      
      // Provide more detailed error response
      return NextResponse.json({ 
        error: 'Failed to get response from SambaNova',
        details: {
          message: sambaError instanceof Error ? sambaError.message : 'Unknown error',
          stack: sambaError instanceof Error ? sambaError.stack : null,
          type: sambaError?.constructor?.name || 'UnknownError'
        }
      }, { status: 500 });
    }
  } catch (requestError) {
    console.error('Request Processing Error:', requestError);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: {
        message: requestError instanceof Error ? requestError.message : 'Unknown error',
        stack: requestError instanceof Error ? requestError.stack : null,
        type: requestError?.constructor?.name || 'UnknownError'
      }
    }, { status: 500 });
  }
}
