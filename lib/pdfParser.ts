import pdfToText from 'react-pdftotext';

interface ParsedPDFContent {
  rawText: string;
  lines: string[];
}

export async function parsePDFContent(pdfBlob: Blob, originalFilename: string): Promise<ParsedPDFContent> {
  try {
    // Convert PDF to text
    const rawText = await pdfToText(pdfBlob);
    
    // Split into meaningful lines, removing empty lines
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const parsedContent = {
      rawText,
      lines
    };

    // Cache the results
    const parts = originalFilename.split('-');
    if (parts.length >= 2) {
      const uuid = parts[parts.length - 2];
      await cacheParseResults(uuid, parsedContent);
    }

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
  
  // Find work experience section using more specific patterns
  const workSection = text.match(/(?:WORK\s+HISTORY|EXPERIENCE|WORK\s+EXPERIENCE|EMPLOYMENT).*?\n([\s\S]+?)(?=\n(?:EDUCATION|SKILLS|CERTIFICATIONS|$))/i);
  
  if (!workSection) return experiences;

  // Split into individual roles - improved pattern to match date-based entries
  const roles = workSection[1].split(/(?=\d{2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})/i);
  
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

    // Extract position and company with improved pattern
    const positionCompanyMatch = role.match(/(?:\d{2}\/\d{4}.*?\n)?(.*?)\n(.*?)(?:\s*[–-]\s*|\n)/);
    if (positionCompanyMatch) {
      experience.position = positionCompanyMatch[1].trim();
      experience.company = positionCompanyMatch[2].replace(/—.*$/, '').trim();
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
  const skillsSections = [
    /SKILLS?:?\s*((?:[•\-\*]\s*[^\n]+\n?)+)/i,
    /TECHNICAL\s+SKILLS?:?\s*((?:[•\-\*]\s*[^\n]+\n?)+)/i,
    /(?:SKILLS?|EXPERTISE)(?:\s*&\s*COMPETENCIES)?:?\s*((?:[^•\n]*(?:\n|$))+)/i
  ];

  for (const regex of skillsSections) {
    const skillsMatch = text.match(regex);
    if (skillsMatch) {
      // Handle both bullet points and comma-separated lists
      const skillsText = skillsMatch[1];
      if (skillsText.includes('•') || skillsText.includes('-') || skillsText.includes('*')) {
        return skillsText
          .match(/[•\-\*]\s*([^\n]+)/g)
          ?.map(skill => skill.replace(/^[•\-\*]\s*/, '').trim()) || [];
      } else {
        return skillsText
          .split(/[,\n]/)
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
      }
    }
  }

  return [];
}

function extractCertifications(text: string): Certification[] {
  const certifications: Certification[] = [];
  
  const certSection = text.match(/CERTIFICATIONS?.*?\n([\s\S]+?)(?=\n(?:EDUCATION|SKILLS|EXPERIENCE|$))/i);
  
  if (!certSection) return certifications;

  const certLines = certSection[1].split('\n').filter(line => line.trim());
  
  for (const line of certLines) {
    if (!line.trim() || line.trim().length < 3) continue;

    const cert: Certification = {
      name: '',
      issuer: '',
      date: '',
      expiryDate: ''
    };

    // Extract certification with date pattern (PMP - 2023)
    const certMatch = line.match(/([^(]+)(?:\s*\(([^)]+)\))?/);
    if (certMatch) {
      cert.name = certMatch[1].trim();
      if (certMatch[2]) {
        // Handle different date formats
        const dateMatch = certMatch[2].match(/(\d{4})/);
        if (dateMatch) {
          cert.date = dateMatch[1];
        }
      }
    }

    certifications.push(cert);
  }

  return certifications;
}

async function cacheParseResults(uuid: string, content: ParsedPDFContent): Promise<void> {
  try {
    const cache = await caches.open('pdf-storage');
    const timestamp = Date.now();
    const filename = `parsed-${uuid}-${timestamp}.txt`;
    
    const response = new Response(content.rawText, {
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
