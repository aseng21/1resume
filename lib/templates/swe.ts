import { ResumeData } from '@/types/resume';

// Helper function to escape LaTeX special characters
const escapeLatex = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/\$/g, '\\$')  // Escape $ first
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%#_{}~^]/g, '\\$&')
    .replace(/–/g, '-')  // Replace en-dash with hyphen
    .replace(/\^/g, '\\^{}')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\~{}');
};

// Helper function to format GitHub URLs
const formatGithubUrl = (url: string): string => url.replace('–', '--');

// Helper function to format dates
const formatDate = (date: string): string => {
  if (!date) return 'Present';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const transformAIResponseToResumeData = (aiResponse: any): ResumeData => {
  console.log('Starting transformation of AI response:', aiResponse);

  if (!aiResponse) {
    throw new Error('No AI response provided');
  }

  // Handle contact_info structure and get name
  const contactInfo = aiResponse.contact_info || aiResponse;
  const name = contactInfo?.name || aiResponse?.name || '';

  if (!name) {
    throw new Error('Missing required field: name');
  }

  // Create default data structure with empty strings and arrays
  const defaultData: ResumeData = {
    name: '',
    contact: {},
    education: {},
    skills: {},
    experience: [],
    projects: [],
    publications: [],
    awards: [],
    volunteer: []
  };

  // Helper function to safely get array
  const safeArray = <T>(value: any): T[] => {
    return Array.isArray(value) ? value : [];
  };

  // Helper function to safely get string
  const safeString = (value: any): string | undefined => {
    return typeof value === 'string' ? value : undefined;
  };

  // Transform and validate the data
  const resumeData: ResumeData = {
    ...defaultData,
    name,
    contact: {
      email: safeString(contactInfo?.email),
      phone: safeString(contactInfo?.phone),
      website: safeString(contactInfo?.website),
      github: safeString(contactInfo?.github),
      linkedin: safeString(contactInfo?.linkedin)
    },
    education: {
      university: safeString(aiResponse?.education?.university),
      location: safeString(aiResponse?.education?.location) || safeString(contactInfo?.location),
      degree: safeString(aiResponse?.education?.degree),
      graduation_date: safeString(aiResponse?.education?.graduation_date),
      gpa: safeString(aiResponse?.education?.gpa),
      courses: safeArray<string>(aiResponse?.education?.courses)
    },
    skills: {
      languages: safeArray<string>(aiResponse?.skills?.languages),
      frameworks: safeArray<string>(aiResponse?.skills?.frameworks),
      tools: safeArray<string>(aiResponse?.skills?.tools),
      platforms: safeArray<string>(aiResponse?.skills?.platforms) || safeArray<string>(aiResponse?.certifications),
      soft_skills: safeArray<string>(aiResponse?.skills?.soft_skills)
    },
    experience: safeArray<any>(aiResponse?.experience).map(exp => ({
      company: safeString(exp?.company),
      location: safeString(exp?.location),
      title: safeString(exp?.title),
      dates: safeString(exp?.dates),
      achievements: safeArray<string>(exp?.achievements)
    })),
    projects: safeArray<any>(aiResponse?.projects).map(proj => ({
      name: safeString(proj?.title) || safeString(proj?.name),
      description: safeString(proj?.description),
      tech_used: safeString(proj?.tech_used) || safeString(proj?.github),
      date: safeString(proj?.date)
    })),
    publications: safeArray<any>(aiResponse?.publications).map(pub => ({
      title: safeString(pub?.title),
      description: safeString(pub?.description),
      tech_used: safeString(pub?.tech_used),
      date: safeString(pub?.date)
    })),
    awards: safeArray<string>(aiResponse?.awards) || safeArray<string>(aiResponse?.certifications),
    volunteer: safeArray<any>(aiResponse?.volunteer).map(vol => ({
      organization: safeString(vol?.organization),
      location: safeString(vol?.location),
      role: safeString(vol?.role),
      description: safeString(vol?.description),
      dates: safeString(vol?.dates)
    }))
  };

  console.log('Transformed resume data:', resumeData);
  return resumeData;
};

export const generateSWELatexFromAI = async (aiResponse: string | any): Promise<{ texDoc: string; opts: any }> => {
  try {
    console.log('Generating LaTeX from AI response:', aiResponse);
    
    // Parse the response if it's a string
    const parsedResponse = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
    console.log('Parsed AI response:', parsedResponse);
    
    // Transform the data
    const resumeData = transformAIResponseToResumeData(parsedResponse);
    console.log('Transformed resume data:', resumeData);
    
    // Generate LaTeX
    const latex = generateSWELatex(resumeData);
    console.log('Generated LaTeX document length:', latex.texDoc.length);
    
    return latex;
  } catch (error) {
    console.error('Error generating LaTeX:', error);
    throw error;
  }
};

export const generateSWELatex = (resumeData: ResumeData): { texDoc: string; opts: any } => {
  const name = "Oleksii Levkovskyi";

  const latex = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[pdftex]{hyperref}
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-0.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\begin{document}

\\begin{center}
{\\Huge \\scshape ${escapeLatex(name)}} \\\\ \\vspace{1pt}
\\small
\\href{${resumeData.sample_work || 'https://github.com/oleksii-levkovskyi'}}{Github} $\\cdot$
\\href{https://linkedin.com/in/oleksii-levkovskyi}{LinkedIn}
\\end{center}

\\section{Education}
\\begin{itemize}[leftmargin=*]
\\item \\textbf{Florida Atlantic University} \\\\
Bachelor of Science; Magna Cum Laude
\\item \\textbf{Nova Southeastern University} \\\\
Master of Science in Computer Science, Natural Language Processing
\\end{itemize}

\\section{Experience}
\\begin{itemize}[leftmargin=*]
\\item \\textbf{TWOSENSE.AI} \\hfill {New York} \\\\
\\emph{Founding Engineer, Full Stack}
\\begin{itemize}[leftmargin=*]
\\item \\textbf{Mobile Engineer (Android):}
\\begin{itemize}
\\item Implemented a Foreground Service-based application that subscribes to and processes sensor data, optimizing for power and CPU utilization
\\item Designed a proprietary Java framework for multi-threaded, graph-based data processing APIs
\\item Used RxJava to build an event-driven mobile architecture
\\item Utilized dependency injection (Dagger) in the mobile frontend
\\end{itemize}
\\item \\textbf{Backend Engineer - Data Processing \\& Machine Learning:}
\\begin{itemize}
\\item Ported Python-based machine learning models to run on the mobile backend (TensorFlow Lite)
\\item Built machine learning data pipelines using scikit-learn, with custom ONNX optimizations
\\end{itemize}
\\item \\textbf{Chrome Extension Developer:}
\\begin{itemize}
\\item Developed a Chromium (Google Chrome, Edge) extension using JavaScript (ES6) for data collection and analysis
\\end{itemize}
\\item \\textbf{.NET Developer:}
\\begin{itemize}
\\item Implemented a background service-based desktop client for global input monitoring on Windows machines
\\end{itemize}
\\end{itemize}

\\item \\textbf{Florida Atlantic University} \\\\
\\emph{Firmware Engineer}
\\begin{itemize}
\\item Co-designed a patent-pending educational embedded device with Dr. Bassem Alhalabi at Florida Atlantic University
\\item Implemented proprietary firmware in Embedded C and MSP430 Assembly
\\end{itemize}

\\item \\textbf{Motorola Solutions} \\\\
\\emph{Image Processing Engineer, Intern}
\\begin{itemize}
\\item Created and deployed a fully-functional web gallery for 3D models with frontend and backend components
\\item Developed a specialized compression algorithm for stereo images of laser-scanned objects with savings of up to 18\\% using C++ and OpenCV
\\end{itemize}

\\item \\textbf{Florida Department of Transportation} \\\\
\\emph{iOS Engineer}
\\begin{itemize}
\\item Upgraded and maintained the Sunpass road toll payment application, available to hundreds of thousands of users in Florida monthly
\\end{itemize}

\\item \\textbf{Florida Atlantic University} \\\\
\\emph{Research Author}
\\begin{itemize}
\\item Extended Abstract and Implementation: Research on boolean expression evaluation
\\item Development of an educational smartphone game powered by a modified version of the Shunting Yard algorithm
\\item Presented at FURC 2016 and approved by LACCEI (July 2016)
\\end{itemize}
\\end{itemize}

\\section{Technical Skills}
\\begin{itemize}[leftmargin=*]
\\item \\textbf{Languages:} C/C++, Java, Python 3, JavaScript [ES6], Swift 5
\\item \\textbf{CPU Architectures/ASM:} ARM Cortex M-\\{0...4\\}, MSP430
\\item \\textbf{Tools:} Git, SVN, Jira
\\item \\textbf{Frameworks/Libraries:} Cocoa, Android SDK/NDK, Flask, Django, React, RxJS, Node.js
\\end{itemize}

\\end{document}`;

  return {
    texDoc: latex,
    opts: {
      format: 'latex',
      packages: ['latexsym', 'fullpage', 'titlesec', 'marvosym', 'color', 'verbatim', 'enumitem', 'hyperref', 'fancyhdr']
    }
  };
};
