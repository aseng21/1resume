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

export async function getSambaNovaResponse(prompt: string) {
  // Validate prompt
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  const messages: Message[] = [
    { role: 'system', content: 'Answer the question in a couple sentences.' },
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
