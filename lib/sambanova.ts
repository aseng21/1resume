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

export async function getSambaNovaResponse(
  prompt: string, 
  systemPrompt?: string, 
  additionalContext?: { 
    jobListing?: string, 
    resumeContent?: string 
  }
) {
  // Validate prompt
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  // LaTeX Resume Template
  const latexResumeTemplate = `\\documentclass[11pt,a4paper]{moderncv}
\\moderncvstyle{classic}
\\moderncvcolor{blue}

\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.75]{geometry}

\\firstname{[FIRST_NAME]}
\\lastname{[LAST_NAME]}
\\email{[EMAIL]}
\\phone{[PHONE]}

\\begin{document}
\\makecvtitle

\\section{Professional Summary}
[PROFESSIONAL_SUMMARY]

\\section{Work Experience}
[WORK_EXPERIENCE]

\\section{Education}
[EDUCATION]

\\section{Skills}
[SKILLS]
\\end{document}`;

  // Default system prompt for resume optimization
  const defaultSystemPrompt = `You are a professional Resume Analysis Expert and LaTeX Resume Formatter. Your primary objectives are:
1. Carefully analyze the provided job listing
2. Thoroughly review the candidate's resume
3. Strategically modify the resume to align perfectly with the job requirements
4. Highlight and emphasize skills, experiences, and education most relevant to the specific job
5. Prepare a structured LaTeX resume template that presents the candidate as an ideal match for the position

Specific Instructions:
- Match keywords from the job listing
- Restructure experience sections to showcase most relevant achievements
- Tailor language to reflect the job's specific needs
- Remove or de-emphasize irrelevant information
- Create a targeted, compelling resume that increases interview chances
- Format the resume using the provided LaTeX template, filling in placeholders with optimized content`;

  // Alternative system prompt for identifying resume gaps
  const gapAnalysisSystemPrompt = `Analyze the resume and job listing to identify skill and experience gaps. Provide a detailed breakdown of areas where the candidate's current resume falls short of the job requirements.`;

  // Combine context if available
  let fullPrompt = prompt;
  if (additionalContext) {
    const contextParts = [];
    if (additionalContext.jobListing) {
      contextParts.push(`Job Listing:\n${additionalContext.jobListing}`);
    }
    if (additionalContext.resumeContent) {
      contextParts.push(`Current Resume Content:\n${additionalContext.resumeContent}`);
    }
    contextParts.push(`LaTeX Resume Template:\n${latexResumeTemplate}`);
    contextParts.push(`User Prompt:\n${prompt}`);
    
    fullPrompt = contextParts.join('\n\n');
  }

  const messages: Message[] = [
    { 
      role: 'system', 
      content: systemPrompt || defaultSystemPrompt
    },
    { role: 'user', content: fullPrompt }
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
