import OpenAI from 'openai';

type Role = 'system' | 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

const client = new OpenAI({
  baseURL: 'https://api.sambanova.ai/v1',
  apiKey: process.env.SAMBANOVA_API_KEY || '',
  dangerouslyAllowBrowser: true, // Added to allow browser usage
});

const SWE_ANALYSIS_PROMPT = `You are an expert resume analyst and career advisor specializing in software engineering positions. Analyze the provided resume and job description to optimize the resume content. Return your response in this exact format:

{
  "basics": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1 (555) 555-5555",
    "location": "City, State",
    "website": "https://example.com",
    "profiles": [{"url": "https://github.com/username"}]
  },
  "education": [
    {
      "institution": "University Name",
      "area": "Field of Study",
      "studyType": "Degree Type",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "score": "GPA if available",
      "location": "City, State"
    }
  ],
  "work": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "highlights": [
        "Achievement 1",
        "Achievement 2"
      ]
    }
  ],
  "skills": [
    {
      "name": "Category (e.g., Languages)",
      "keywords": ["Skill 1", "Skill 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "highlights": [
        "Key achievement 1",
        "Key achievement 2"
      ],
      "keywords": ["Tech 1", "Tech 2"],
      "url": "https://github.com/username/project"
    }
  ],
  "awards": [
    {
      "title": "Award Name",
      "date": "YYYY-MM-DD",
      "awarder": "Organization",
      "summary": "Brief description"
    }
  ],
  "volunteer": [
    {
      "organization": "Organization Name",
      "position": "Role",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "summary": "Brief description",
      "highlights": ["Achievement 1"]
    }
  ]
}

Important:
1. Return ONLY valid JSON, no markdown or other text
2. Use YYYY-MM-DD for all dates
3. Only include sections that have content
4. Format all URLs as complete URLs (e.g., https://github.com/...)`;

const gapAnalysisSystemPrompt = `You are an expert resume analyst specializing in identifying gaps between resumes and job requirements. Analyze the provided resume and job listing, then return your analysis in this exact format:

{
  "eligibilityRequirements": [
    {
      "requirement": "Requirement name",
      "status": "met" | "partial" | "missing",
      "details": "Detailed explanation of how the requirement is or isn't met"
    }
  ],
  "otherGaps": [
    {
      "area": "Gap area (e.g., Location, Experience)",
      "description": "Detailed description of the gap"
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": "Specific action to address gaps",
      "details": "Detailed explanation of how to implement the recommendation"
    }
  ],
  "matchScore": {
    "overall": 0-100,
    "breakdown": {
      "technicalSkills": 0-100,
      "experience": 0-100,
      "education": 0-100,
      "requirements": 0-100
    }
  }
}

Important:
1. Return ONLY valid JSON, no markdown or other text
2. Be specific and actionable in recommendations
3. Provide detailed explanations for each gap and recommendation`;

const defaultSystemPrompt = SWE_ANALYSIS_PROMPT;

export async function getSambaNovaResponse(
  prompt: string, 
  systemPrompt?: string,
  additionalContext?: { 
    jobListing?: string, 
    resumeContent?: string 
  }
) {
  // validate prompt
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  // combine context if available
  let fullPrompt = prompt;
  if (additionalContext) {
    const contextParts = [];
    if (additionalContext.jobListing) {
      contextParts.push(`Job Listing:\n${additionalContext.jobListing}`);
    }
    if (additionalContext.resumeContent) {
      contextParts.push(`Current Resume Content:\n${additionalContext.resumeContent}`);
    }
    contextParts.push(`User Prompt:\n${prompt}`);
    
    fullPrompt = contextParts.join('\n\n');
  }

  const messages: Message[] = [
    { 
      role: 'system', 
      content: systemPrompt || SWE_ANALYSIS_PROMPT
    },
    { role: 'user', content: fullPrompt }
  ];

  try {
    const response = await client.chat.completions.create({
      messages,
      model: 'Meta-Llama-3.1-70B-Instruct',
      stream: false,
    });

    const responseContent = response.choices[0].message?.content;

    if (!responseContent) {
      throw new Error('Received empty response from SambaNova API');
    }

    return {
      response: responseContent,
      raw: response
    };
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
