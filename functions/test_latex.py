import requests
import base64
import os
import sys

def read_latex_file(file_path):
    with open(file_path, 'r') as f:
        return f.read()

# Use file if provided as argument, otherwise use test document
if len(sys.argv) > 1:
    latex_content = read_latex_file(sys.argv[1])
else:
    # Simple test LaTeX document
    latex_content = r"""
\documentclass[11pt,letterpaper]{article}
\usepackage{fontawesome5}
\usepackage[utf8]{inputenc}
\usepackage{geometry}

\begin{document}
\section{Test Document}
This is a test document with a FontAwesome icon: \faGithub

\section{Contact}
\faEnvelope\ email@example.com \\
\faPhone\ (123) 456-7890
\end{document}
"""

# Send request to local endpoint
response = requests.post(
    'http://localhost:8080/latex-to-pdf',
    json={'latex': latex_content},
    headers={'Content-Type': 'application/json'}
)

if response.status_code == 200:
    # Save the PDF
    pdf_data = base64.b64decode(response.json()['pdf'])
    output_file = 'test_output.pdf'
    with open(output_file, 'wb') as f:
        f.write(pdf_data)
    print(f"PDF generated successfully! Check {output_file}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
