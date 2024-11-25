import { ResumeData } from '@/types/resume';

// LaTeX special character escaping
const escapeLatex = (text: string): string => {
  const replacements: { [key: string]: string } = {
    '&': '\\&',
    '%': '\\%',
    '$': '\\$',
    '#': '\\#',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
    '\\': '\\textbackslash{}',
  };
  return text.replace(/[&%$#_{}~^\\]/g, (match) => replacements[match] || match);
};

const formatDate = (date: string): string => {
  if (!date) return 'Present';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const generateSWELatex = (data: ResumeData): { texDoc: string; opts: any } => {
  const {
    basics,
    education,
    work,
    skills,
    projects,
    awards,
    volunteer
  } = data;

  const educationSection = education?.map(edu => `
    \\resumeSubheading
      {${escapeLatex(edu.institution)}}{${escapeLatex(edu.location)}}
      {${escapeLatex(edu.studyType)} - ${escapeLatex(edu.area)}${edu.score ? `;  GPA: ${edu.score}` : ''}}{${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}}
  `).join('\n') || '';

  const skillsSection = skills?.map(skill => `
    \\resumeSubItem{${escapeLatex(skill.name)}}{${escapeLatex(skill.keywords.join(', '))}}
  `).join('\n') || '';

  const workSection = work?.map(job => `
    \\resumeSubheading{${escapeLatex(job.company)}}{${escapeLatex(job.location)}}
    {${escapeLatex(job.position)}}{${formatDate(job.startDate)} - ${formatDate(job.endDate)}}
    \\resumeItemListStart
      ${job.highlights.map(highlight => `\\resumeItem{${escapeLatex(highlight)}}{}`).join('\n      ')}
    \\resumeItemListEnd
  `).join('\n') || '';

  const projectsSection = projects?.map(project => `
    \\resumeSubItem{${escapeLatex(project.name)}}{${escapeLatex(project.description)}}
    ${project.highlights.map(highlight => `\\vspace{2pt}\n    \\resumeItem{${escapeLatex(highlight)}}{}`).join('\n    ')}
    ${project.keywords.length ? `\\vspace{2pt}\n    \\textit{Technologies used: ${escapeLatex(project.keywords.join(', '))}}` : ''}
  `).join('\n\\vspace{5pt}\n') || '';

  const awardsSection = awards?.map(award => 
    `\\item {${escapeLatex(award.title)} - ${formatDate(award.date)}}`
  ).join('\n\\vspace{-5pt}\n') || '';

  const volunteerSection = volunteer?.map(vol => `
    \\resumeSubheading
      {${escapeLatex(vol.organization)}}{${escapeLatex(vol.position)}}
      {${escapeLatex(vol.summary)}}{${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}}
  `).join('\n') || '';

  const texDoc = `
\\documentclass[a4paper,20pt]{article}

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
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.530in}
\\addtolength{\\evensidemargin}{-0.375in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.45in}
\\addtolength{\\textheight}{1in}

\\urlstyle{rm}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-10pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-6pt}]

% Custom commands
\\newcommand{\\resumeItem}[2]{
  \\item\\small{
    \\textbf{#1}{: #2 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{#3} & \\textit{#4} \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-3pt}}

\\renewcommand{\\labelitemii}{$\\circ$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

%----------HEADING-----------------
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
  \\textbf{{\\LARGE ${escapeLatex(basics.name)}}} & Email: \\href{mailto:${basics.email}}{${escapeLatex(basics.email)}}\\\\
  ${basics.website ? `\\href{${basics.website}}{Portfolio: ${escapeLatex(basics.website)}} & ` : ''}Mobile: ${escapeLatex(basics.phone)}\\\\
  ${basics.profiles?.[0]?.url ? `\\href{${basics.profiles[0].url}}{Github: ${escapeLatex(basics.profiles[0].url.replace('https://', ''))}}` : ''}
\\end{tabular*}

%-----------EDUCATION-----------------
\\section{Education}
\\resumeSubHeadingListStart
${educationSection}
\\resumeSubHeadingListEnd

\\section{Skills Summary}
\\resumeSubHeadingListStart
${skillsSection}
\\resumeSubHeadingListEnd

\\section{Experience}
\\resumeSubHeadingListStart
${workSection}
\\resumeSubHeadingListEnd

%-----------PROJECTS-----------------
\\section{Projects}
\\resumeSubHeadingListStart
${projectsSection}
\\resumeSubHeadingListEnd

${awards.length ? `
\\section{Honors and Awards}
\\begin{description}[font=$\\bullet$]
${awardsSection}
\\end{description}
` : ''}

${volunteer.length ? `
\\section{Volunteer Experience}
\\resumeSubHeadingListStart
${volunteerSection}
\\resumeSubHeadingListEnd
` : ''}

\\end{document}
`;

  return {
    texDoc,
    opts: {
      format: 'pdf',
      command: 'pdflatex',
      inputs: ['.']
    }
  };
};
