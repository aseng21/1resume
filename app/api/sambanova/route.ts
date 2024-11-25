import { NextRequest, NextResponse } from 'next/server';
import { getSambaNovaResponse } from '@/lib/sambanova';

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt, additionalContext } = await request.json();

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt is required',
        details: 'The request must include a non-empty prompt'
      }, { status: 400 });
    }

    try {
      const response = await getSambaNovaResponse(
        prompt,
        systemPrompt,
        additionalContext
      );

      return NextResponse.json(response);
    } catch (error) {
      console.error('SambaNova API Error:', error);
      return NextResponse.json({ 
        error: 'Failed to get response from SambaNova',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
