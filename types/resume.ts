export interface ResumeData {
  name: string;
  contact: {
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  education: Array<{
    school: string;
    degree: string;
    field?: string;
    date: string;
    gpa?: string;
    location?: string;
    achievements?: string[];
  }>;
  experience: Array<{
    company: string;
    title: string;
    location?: string;
    date: string;
    achievements: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    link?: string;
    achievements?: string[];
  }>;
  skills?: {
    languages?: string[];
    frameworks?: string[];
    tools?: string[];
    other?: string[];
  };
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
    link?: string;
  }>;
  awards?: Array<{
    name: string;
    issuer?: string;
    date?: string;
    description?: string;
  }>;
}
