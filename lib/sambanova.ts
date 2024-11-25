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

const SWE_ANALYSIS_PROMPT = `You are a resume optimization API endpoint. You MUST return a valid JSON object and NOTHING else - no explanations, no markdown, no text. Your response will be parsed as JSON and used directly in a LaTeX template.

The JSON response MUST contain ALL of these required fields in EXACTLY this format:

{
  "contact_info": {  // REQUIRED: All contact fields
    "name": "Full Name",  // REQUIRED: The person's full name
    "location": "City, State",  // REQUIRED: Current location
    "email": "email@example.com",
    "phone": "(XXX) XXX-XXXX",  // Format: (XXX) XXX-XXXX
    "website": "portfolio.com",  // Format: domain only, no https://
    "github": "username",        // Format: username only, no https://github.com/
    "linkedin": "username"       // Format: username only, no https://linkedin.com/in/
  },
  "education": {  // REQUIRED: All education fields
    "degree": "Bachelor of Science in Computer Science",
    "university": "University Name",
    "graduation_date": "Month YYYY"
  },
  "experience": [  // REQUIRED: At least one experience entry
    {
      "title": "Software Engineer",
      "company": "Company Name",
      "location": "City, Country",
      "dates": "Month YYYY - Month YYYY",
      "achievements": [
        "Achievement 1 with quantifiable metrics",
        "Achievement 2 with quantifiable metrics"
      ]
    }
  ],
  "skills": {  // REQUIRED: All skills categories with at least one item
    "languages": ["Python", "JavaScript", "Java"],     // Programming languages
    "frameworks": ["React", "Node.js", "Django"],      // Libraries and frameworks
    "tools": ["Git", "Docker", "AWS"]                 // Development tools and platforms
  },
  "certifications": [  // Optional: List of certifications
    "Certification name with date (YYYY)"
  ],
  "projects": [  // REQUIRED: At least one project
    {
      "title": "Project Name",
      "github": "Brief description of technologies used",  // Used as tech stack description
      "description": "One line description with quantifiable impact"
    }
  ]
}

IMPORTANT RULES:
1. Return ONLY the resume data in the EXACT format shown above
2. ALL fields marked as REQUIRED must be present and non-empty
3. Format dates consistently as "Month YYYY" (e.g., "September 2023")
4. Keep achievements and descriptions concise and quantifiable
5. Do NOT include any fields not shown in the template above
6. Do NOT include any text outside the JSON object
7. Format contact info exactly as shown (no https://, proper phone format)
8. Ensure all required arrays have at least one item
9. Use proper capitalization for names, titles, and organizations
10. Keep descriptions under 100 characters
11. Include metrics and numbers in achievements where possible`;

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
  },
  temperature?: number
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
      temperature: temperature || 0.2,
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

export async function callSambaNova(prompt: string, temperature: number = 0.2) {
  const response = await getSambaNovaResponse(prompt, undefined, undefined, temperature);
  return response;
}
