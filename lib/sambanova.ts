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
  const messages: Message[] = [
    { role: 'system', content: 'Answer the question in a couple sentences.' },
    { role: 'user', content: prompt }
  ];

  try {
    const completion = await client.chat.completions.create({
      model: ' Meta-Llama-3.1-70B-Instruct',
      messages,
      stream: false,
    });

    return completion.choices[0].message?.content || 'No response';
  } catch (error) {
    console.error('Error getting response:', error);
    throw error;
  }
}
