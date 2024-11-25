import { NextRequest, NextResponse } from 'next/server';
import { callSambaNova } from '@/lib/sambanova';

export async function POST(request: NextRequest) {
  try {
    const { role, jobDescription } = await request.json();

    if (!role || !jobDescription) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'The request must include both role and jobDescription'
      }, { status: 400 });
    }

    const prompt = `Given this job description:\n${jobDescription}\n\nOptimize and tailor a resume for this role, focusing on relevant skills and experiences.`;
    const result = await callSambaNova(prompt, 0.2);

    console.log('Successfully processed request');
    return NextResponse.json(result);
  } catch (error) {
    console.error('SambaNova API Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      error: 'Failed to get response from SambaNova',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
