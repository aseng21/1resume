import OpenAI from 'openai';

// Define types for the message structure
type Role = 'system' | 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

// Create the OpenAI client instance
const client = new OpenAI({
  baseURL: 'https://api.sambanova.ai/v1',
  apiKey: process.env.SAMBANOVA_API_KEY || '',
  dangerouslyAllowBrowser: true, // Added to allow browser usage
});

export async function getSambaNovaResponse(prompt: string, systemPrompt?: string) {
  // Validate prompt
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  // Default system prompt for resume optimization
  const defaultSystemPrompt = `You are a professional Resume Analysis Expert. Your primary objective is to:
1. Carefully analyze the provided job listing
2. Thoroughly review the candidate's resume
3. Strategically modify the resume to align perfectly with the job requirements
4. Highlight and emphasize skills, experiences, and education most relevant to the specific job
5. Ensure the modified resume presents the candidate as an ideal match for the position

Focus on:
- Matching keywords from the job listing
- Restructuring experience sections to showcase most relevant achievements
- Tailoring language to reflect the job's specific needs
- Removing or de-emphasizing irrelevant information
- Creating a targeted, compelling resume that increases the candidate's chances of securing an interview`;

  // Alternative system prompt for identifying resume gaps
  const gapAnalysisSystemPrompt = `You are a critical Resume Reviewer. Your primary objective is to:
1. Carefully analyze the provided job listing
2. Thoroughly review the candidate's resume
3. Identify and highlight:
   - Missing skills or qualifications required by the job
   - Gaps in experience relevant to the job requirements
   - Potential weaknesses in the current resume
   - Areas where the candidate falls short of the job description

Focus on:
- Comparing the resume line-by-line with the job listing
- Pointing out specific skills or experiences not present
- Suggesting concrete ways to improve the resume
- Providing constructive, detailed feedback on resume deficiencies
- Helping the candidate understand where they need to improve to be a stronger candidate`;

  const messages: Message[] = [
    { 
      role: 'system', 
      content: systemPrompt || defaultSystemPrompt
    },
    { role: 'user', content: prompt }
  ];

  try {
    // Check API key
    if (!process.env.SAMBANOVA_API_KEY) {
      throw new Error('SambaNova API key is not configured');
    }

    const completion = await client.chat.completions.create({
      model: 'Meta-Llama-3.1-70B-Instruct',
      messages,
      stream: false,
    });

    const responseContent = completion.choices[0].message?.content;

    if (!responseContent) {
      throw new Error('Received empty response from SambaNova API');
    }

    return responseContent;
  } catch (error) {
    console.error('Detailed SambaNova Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: error?.constructor?.name || 'UnknownError'
    });
    throw error;
  }
}
