import pdfToText from 'react-pdftotext';
import { v4 as uuidv4 } from 'uuid';

async function extractText(file: Blob): Promise<string> {
  try {
    const text = await pdfToText(file);
    return text;
  } catch (error) {
    console.error("Failed to extract text from pdf", error);
    throw error;
  }
}

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  summary?: string;
}

interface WorkExperience {
  company: string;
  position: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  responsibilities: string[];
  achievements: string[];
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate?: string;
  gpa?: string;
  achievements?: string[];
}

interface Certification {
  name: string;
  issuer: string;
  date?: string;
  expiryDate?: string;
}

interface ParsedPDFContent {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  languages?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

export async function parsePDFContent(pdfBlob: Blob, originalFilename: string): Promise<ParsedPDFContent> {
  try {
    // Extract UUID from filename (format: originalname-uuid-timestamp.pdf)
    const parts = originalFilename.split('-');
    if (parts.length < 2) {
      throw new Error('Invalid filename format');
    }
    const uuid = parts[parts.length - 2]; // Get the UUID part
    
    // Convert blob to text using our extractText function
    const fullText = await extractText(pdfBlob);
    
    const parsedContent: ParsedPDFContent = {
      personalInfo: extractPersonalInfo(fullText),
      workExperience: extractWorkExperience(fullText),
      education: extractEducation(fullText),
      skills: extractSkills(fullText),
      certifications: extractCertifications(fullText)
    };

    // Cache parsed content
    await cacheParseResults(uuid, parsedContent);

    return parsedContent;
  } catch (error) {
    console.error('PDF Parsing Error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractPersonalInfo(text: string): PersonalInfo {
  const sections = text.split('\n\n');
  const headerSection = sections[0];
  
  const personalInfo: PersonalInfo = {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: ''
  };

  // Name extraction (usually first line or in larger font)
  const nameMatch = headerSection.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  if (nameMatch) personalInfo.name = nameMatch[1];

  // Email extraction
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) personalInfo.email = emailMatch[0];

  // Phone extraction
  const phoneMatch = text.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) personalInfo.phone = phoneMatch[0];

  // Location extraction
  const locationMatch = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/);
  if (locationMatch) personalInfo.location = locationMatch[1];

  // LinkedIn extraction
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/);
  if (linkedinMatch) personalInfo.linkedin = `https://www.${linkedinMatch[0]}`;

  // Website extraction
  const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?/);
  if (websiteMatch) personalInfo.website = websiteMatch[0];

  // Summary/Objective extraction
  const summaryMatch = text.match(/(?:Summary|Profile|Objective):?\s*((?:[^\n]+\n?){1,5})/i);
  if (summaryMatch) personalInfo.summary = summaryMatch[1].trim();

  return personalInfo;
}

function extractWorkExperience(text: string): WorkExperience[] {
  const experiences: WorkExperience[] = [];
  
  // Find work experience section
  const workSection = text.match(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT).*?\n([\s\S]+?)(?=\n(?:EDUCATION|SKILLS|CERTIFICATIONS|$))/i);
  
  if (!workSection) return experiences;

  // Split into individual roles
  const roles = workSection[1].split(/(?=\n[A-Z][^a-z\n]{2,})/);
  
  for (const role of roles) {
    if (!role.trim()) continue;

    const experience: WorkExperience = {
      company: '',
      position: '',
      duration: '',
      startDate: '',
      endDate: '',
      responsibilities: [],
      achievements: []
    };

    // Extract company and position
    const headerMatch = role.match(/^(.*?)\n(.*?)\n/);
    if (headerMatch) {
      experience.company = headerMatch[1].trim();
      experience.position = headerMatch[2].trim();
    }

    // Extract dates
    const dateMatch = role.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*(?:-|–|to)\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})/i);
    if (dateMatch) {
      experience.duration = dateMatch[0];
      const [start, end] = dateMatch[0].split(/\s*(?:-|–|to)\s*/);
      experience.startDate = start;
      experience.endDate = end;
    }

    // Extract responsibilities and achievements
    const bullets = role.match(/[•\-\*]\s*([^\n]+)/g) || [];
    experience.responsibilities = bullets.map(bullet => 
      bullet.replace(/^[•\-\*]\s*/, '').trim()
    );

    // Look for achievements section
    const achievementSection = role.match(/Achievements?:?\s*((?:[•\-\*]\s*[^\n]+\n?)+)/i);
    if (achievementSection) {
      experience.achievements = achievementSection[1]
        .match(/[•\-\*]\s*([^\n]+)/g)
        ?.map(bullet => bullet.replace(/^[•\-\*]\s*/, '').trim()) || [];
    }

    experiences.push(experience);
  }

  return experiences;
}

function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  
  // Find education section
  const eduSection = text.match(/EDUCATION.*?\n([\s\S]+?)(?=\n(?:EXPERIENCE|SKILLS|CERTIFICATIONS|$))/i);
  
  if (!eduSection) return education;

  // Split into individual institutions
  const institutions = eduSection[1].split(/(?=\n[A-Z][^a-z\n]{2,})/);
  
  for (const inst of institutions) {
    if (!inst.trim()) continue;

    const edu: Education = {
      institution: '',
      degree: '',
      field: '',
      graduationDate: '',
      gpa: '',
      achievements: []
    };

    // Extract institution name
    const instMatch = inst.match(/^(.*?)\n/);
    if (instMatch) edu.institution = instMatch[1].trim();

    // Extract degree and field
    const degreeMatch = inst.match(/(?:Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?).*?(?:of|in)?\s+([^,\n]+)/i);
    if (degreeMatch) {
      edu.degree = degreeMatch[0].split('of').shift()?.trim() || '';
      edu.field = degreeMatch[1].trim();
    }

    // Extract graduation date
    const gradMatch = inst.match(/(?:Graduated|Expected|Completion):\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})/i);
    if (gradMatch) edu.graduationDate = gradMatch[1];

    // Extract GPA
    const gpaMatch = inst.match(/GPA:\s*([\d.]+)/i);
    if (gpaMatch) edu.gpa = gpaMatch[1];

    // Extract achievements
    const achievements = inst.match(/[•\-\*]\s*([^\n]+)/g) || [];
    edu.achievements = achievements.map(achievement => 
      achievement.replace(/^[•\-\*]\s*/, '').trim()
    );

    education.push(edu);
  }

  return education;
}

function extractSkills(text: string): string[] {
  // Basic skills extraction
  const skillsRegex = /(?:Skills?|Expertise):\s*(.+?)(?:\n|$)/gi;
  const matches = text.matchAll(skillsRegex);
  return Array.from(matches).map(match => match[1]).slice(0, 10);
}

function extractCertifications(text: string): string[] {
  // Basic certifications extraction
  const certRegex = /(?:Certification|Certificate):\s*(.+?)(?:\n|$)/gi;
  const matches = text.matchAll(certRegex);
  return Array.from(matches).map(match => match[1]).slice(0, 5);
}

async function cacheParseResults(uuid: string, content: ParsedPDFContent): Promise<void> {
  try {
    const cache = await caches.open('pdf-storage');
    const timestamp = Date.now();
    const filename = `parsed-${uuid}-${timestamp}.txt`;
    
    // Create a formatted text representation of parsed content
    const formattedContent = `Personal Info:\n${content.personalInfo}\n\n` +
      `Work Experience:\n${content.workExperience.join('\n')}\n\n` +
      `Education:\n${content.education.join('\n')}\n\n` +
      `Skills:\n${content.skills.join('\n')}\n\n` +
      `Certifications:\n${content.certifications.join('\n')}`;

    const response = new Response(formattedContent, {
      headers: { 
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

    await cache.put(`/parsed/${filename}`, response);
  } catch (error) {
    console.error('Error caching parse results:', error);
  }
}

export async function retrieveParsedContent(uuid: string): Promise<ParsedPDFContent | null> {
  try {
    const cache = await caches.open('pdf-storage');
    const keys = await cache.keys();
    
    // Find the most recent parsed file for this UUID
    const matchingFiles = keys
      .filter(key => key.url.includes(`/parsed/`) && key.url.includes(`-${uuid}-`))
      .sort((a, b) => {
        const extractTimestamp = (url: string) => {
          const match = url.match(/-(\d+)\.txt$/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return extractTimestamp(b.url) - extractTimestamp(a.url);
      });

    if (matchingFiles.length === 0) return null;

    const response = await cache.match(matchingFiles[0]);
    if (!response) return null;

    const text = await response.text();
    const sections = text.split('\n\n');
    
    return {
      personalInfo: sections[0].replace('Personal Info:\n', '').trim(),
      workExperience: sections[1].replace('Work Experience:\n', '').trim().split('\n'),
      education: sections[2].replace('Education:\n', '').trim().split('\n'),
      skills: sections[3].replace('Skills:\n', '').trim().split('\n'),
      certifications: sections[4].replace('Certifications:\n', '').trim().split('\n')
    };
  } catch (error) {
    console.error('Error retrieving parsed content:', error);
    return null;
  }
}
