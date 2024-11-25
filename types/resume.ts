export interface ResumeData {
  basics: {
    name: string;
    email: string;
    phone: string;
    website?: string;
    profiles?: Array<{
      url: string;
    }>;
  };
  education: Array<{
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    score?: string;
    location: string;
  }>;
  work: Array<{
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }>;
  skills: Array<{
    name: string;
    keywords: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    highlights: string[];
    keywords: string[];
  }>;
  awards: Array<{
    title: string;
    date: string;
    awarder: string;
  }>;
  volunteer: Array<{
    organization: string;
    position: string;
    startDate: string;
    endDate: string;
    summary: string;
  }>;
}
