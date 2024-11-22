import { NextRequest, NextResponse } from 'next/server';
import { getSambaNovaResponse } from '@/lib/sambanova';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await getSambaNovaResponse(prompt);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('SambaNova API Error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
