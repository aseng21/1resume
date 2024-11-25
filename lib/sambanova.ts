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

const SWE_ANALYSIS_PROMPT = `You are a resume optimization API endpoint. You MUST return a valid JSON object and NOTHING else - no explanations, no markdown, no text. Your response will be parsed as JSON.

The JSON response MUST follow this EXACT structure (this is the only valid format):

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
}`;

const gapAnalysisSystemPrompt = `You are a resume gap analysis API endpoint. You MUST return a valid JSON object and NOTHING else - no explanations, no markdown, no text. Your response will be parsed as JSON.

The JSON response MUST follow this EXACT structure (this is the only valid format):

{
  "eligibilityRequirements": [
    {
      "requirement": "Requirement name",
      "status": "met",
      "details": "Detailed explanation"
    }
  ],
  "otherGaps": [
    {
      "area": "Gap area",
      "description": "Detailed description"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Specific action",
      "details": "Implementation details"
    }
  ],
  "matchScore": {
    "overall": 85,
    "breakdown": {
      "technicalSkills": 90,
      "experience": 80,
      "education": 85,
      "requirements": 85
    }
  }
}`;

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
      contextParts.push(`Job Description:\n${additionalContext.jobListing}`);
    }
    if (additionalContext.resumeContent) {
      contextParts.push(`Resume Content:\n${additionalContext.resumeContent}`);
    }
    contextParts.push(`Remember: You MUST return ONLY a valid JSON object matching the specified structure. No other text or explanations.\n\nUser Request:\n${prompt}`);
    
    fullPrompt = contextParts.join('\n\n');
  }

  const messages: Message[] = [
    { 
      role: 'system', 
      content: `${systemPrompt || SWE_ANALYSIS_PROMPT}\n\nIMPORTANT: You must return ONLY a JSON object. No other text, no markdown, no explanations.`
    },
    { role: 'user', content: fullPrompt }
  ];

  try {
    console.log('Sending request to SambaNova with:', {
      prompt,
      systemPrompt: systemPrompt || 'default',
      hasJobListing: !!additionalContext?.jobListing,
      hasResumeContent: !!additionalContext?.resumeContent
    });

    const response = await client.chat.completions.create({
      messages,
      model: 'Meta-Llama-3.1-70B-Instruct',
      stream: false,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    console.log('Received response from SambaNova:', {
      status: 'success',
      hasContent: !!response.choices[0].message?.content,
      contentPreview: response.choices[0].message?.content?.substring(0, 100)
    });

    const responseContent = response.choices[0].message?.content;

    if (!responseContent) {
      console.error('Empty response from SambaNova');
      throw new Error('Received empty response from SambaNova API');
    }

    // try to clean the response if it has markdown or text
    let cleanedContent = responseContent;
    if (responseContent.includes('```json')) {
      cleanedContent = responseContent.split('```json')[1].split('```')[0].trim();
    } else if (responseContent.includes('```')) {
      cleanedContent = responseContent.split('```')[1].split('```')[0].trim();
    }

    // validate JSON response
    try {
      const parsedResponse = JSON.parse(cleanedContent);
      console.log('Successfully parsed response as JSON');
      return {
        response: JSON.stringify(parsedResponse),
        raw: response
      };
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', {
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        content: cleanedContent
      });
      throw new Error('API response was not valid JSON');
    }
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
