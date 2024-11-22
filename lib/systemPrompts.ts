export enum ResumeTemplateType {
  CLASSIC = 'classic',
  MODERN = 'modern',
  ACADEMIC = 'academic',
  CREATIVE = 'creative',
  EXECUTIVE = 'executive'
}

export interface SystemPromptTemplate {
  systemPrompt: string;
  latexTemplate: string;
}

export const systemPrompts: Record<ResumeTemplateType, SystemPromptTemplate> = {
  [ResumeTemplateType.CLASSIC]: {
    systemPrompt: `You are a professional Resume Formatter focusing on a traditional, conservative resume style. 
    Prioritize clarity, professionalism, and structured presentation. Emphasize:
    - Clear, concise language
    - Chronological work history
    - Conservative formatting
    - Highlighting key achievements with quantifiable metrics`,
    latexTemplate: `\\documentclass[11pt,a4paper]{moderncv}
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
\\end{document}`
  },
  [ResumeTemplateType.MODERN]: {
    systemPrompt: `You are a modern resume design expert focusing on contemporary, dynamic presentation. 
    Prioritize:
    - Clean, minimalist design
    - Emphasizing personal brand
    - Using modern typography
    - Highlighting innovative achievements
    - Creating a visually engaging layout`,
    latexTemplate: `\\documentclass{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}

\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.8]{geometry}

\\firstname{[FIRST_NAME]}
\\lastname{[LAST_NAME]}
\\email{[EMAIL]}
\\social[linkedin]{[LINKEDIN_PROFILE]}

\\begin{document}
\\makecvtitle

\\section{Profile}
[PROFESSIONAL_SUMMARY]

\\section{Professional Experience}
[WORK_EXPERIENCE]

\\section{Technical Skills}
[SKILLS]

\\section{Education}
[EDUCATION]
\\end{document}`
  },
  [ResumeTemplateType.ACADEMIC]: {
    systemPrompt: `You are an academic resume (CV) formatting specialist. 
    Focus on:
    - Comprehensive research and academic achievements
    - Detailed publication and conference records
    - Scholarly tone and precise language
    - Highlighting academic credentials`,
    latexTemplate: `\\documentclass[11pt,a4paper]{article}
\\usepackage{geometry}
\\geometry{a4paper,margin=1in}

\\begin{document}
\\begin{center}
\\textbf{\\Large [FIRST_NAME] [LAST_NAME]} \\\\
[EMAIL] | [PHONE]
\\end{center}

\\section*{Academic Background}
[EDUCATION]

\\section*{Research Experience}
[WORK_EXPERIENCE]

\\section*{Publications}
[PUBLICATIONS]

\\section*{Skills}
[SKILLS]
\\end{document}`
  },
  [ResumeTemplateType.CREATIVE]: {
    systemPrompt: `You are a creative resume design expert targeting innovative industries. 
    Prioritize:
    - Unique, non-traditional layout
    - Storytelling approach
    - Visual creativity
    - Showcasing personality and unique skills`,
    latexTemplate: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{multicol}
\\usepackage{graphicx}

\\begin{document}
\\begin{center}
\\textbf{\\Huge [FIRST_NAME] [LAST_NAME]} \\\\
\\small{[EMAIL] | [PHONE]}
\\end{center}

\\begin{multicols}{2}
\\section*{Professional Journey}
[PROFESSIONAL_SUMMARY]

\\section*{Key Experiences}
[WORK_EXPERIENCE]

\\section*{Skills Palette}
[SKILLS]
\\end{multicols}
\\end{document}`
  },
  [ResumeTemplateType.EXECUTIVE]: {
    systemPrompt: `You are an executive resume formatting specialist. 
    Focus on:
    - High-level strategic achievements
    - Leadership narrative
    - Concise, impactful language
    - Demonstrating broad business impact`,
    latexTemplate: `\\documentclass[11pt,a4paper]{article}
\\usepackage{geometry}
\\geometry{a4paper,margin=1in}

\\begin{document}
\\begin{center}
\\textbf{\\Large [FIRST_NAME] [LAST_NAME]} \\\\
\\textit{Executive Profile} \\\\
[EMAIL] | [PHONE]
\\end{center}

\\section*{Executive Summary}
[PROFESSIONAL_SUMMARY]

\\section*{Leadership Experience}
[WORK_EXPERIENCE]

\\section*{Strategic Skills}
[SKILLS]

\\section*{Education \& Credentials}
[EDUCATION]
\\end{document}`
  }
};

export function getSystemPromptByType(type: ResumeTemplateType): SystemPromptTemplate {
  return systemPrompts[type];
}
