import OpenAI from 'openai';

// Define types for the message structure
type Role = 'system' | 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

interface StreamResponse {
  choices: {
    delta: {
      content?: string;
      role?: Role;
    };
  }[];
}

// Create the OpenAI client instance
const client = new OpenAI({
  baseURL: 'https://api.sambanova.ai/v1',
  apiKey: process.env.SAMBANOVA_API_KEY || '',
});

export async function* streamCompletion(messages: Message[]) {
  try {
    const completion = await client.chat.completions.create({
      model: 'Meta-Llama-3.1-405B-Instruct',
      messages,
      stream: true,
    });

    for await (const chunk of completion) {
      yield chunk.choices[0].delta;
    }
  } catch (error) {
    console.error('Error in streamCompletion:', error);
    throw error;
  }
}

// Example usage function
export async function getSambaNovaResponse(prompt: string) {
  const messages: Message[] = [
    { role: 'system', content: 'Answer the question in a couple sentences.' },
    { role: 'user', content: prompt }
  ];

  let fullResponse = '';
  
  try {
    for await (const chunk of streamCompletion(messages)) {
      if (chunk.content) {
        fullResponse += chunk.content;
      }
    }
    return fullResponse;
  } catch (error) {
    console.error('Error getting response:', error);
    throw error;
  }
}