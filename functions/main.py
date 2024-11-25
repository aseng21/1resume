import os
import json
import traceback
import tempfile
import subprocess
from pathlib import Path
from firebase_admin import initialize_app
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from scrapegraphai.graphs import SmartScraperGraph
from playwright.sync_api import sync_playwright, Page
import time
import random
import sys
import base64

# Load environment variables
load_dotenv()

# Initialize Firebase app only if it hasn't been initialized
try:
    initialize_app()
except ValueError:
    pass  # App already initialized

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "https://1resume.vercel.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

def capture_full_error():
    """Capture full error details including traceback."""
    exc_type, exc_value, exc_traceback = sys.exc_info()
    return {
        "error_type": str(exc_type.__name__),
        "error_message": str(exc_value),
        "traceback": traceback.format_exc()
    }

def add_cors_headers(response):
    """Add CORS headers to the response."""
    if not isinstance(response, Response):
        response = Response(response)
    
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:3000', 'https://1resume.vercel.app']:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

def handle_preflight():
    """Handle CORS preflight requests."""
    response = Response()
    response = add_cors_headers(response)
    return response

def parse_latex_error(log_content):
    """Parse LaTeX log content for specific error types."""
    error_details = "LaTeX compilation failed:\n"
    error_lines = []
    
    # Common error patterns
    package_error = False
    font_error = False
    syntax_error = False
    
    for line in log_content.split('\n'):
        # Package errors
        if "! LaTeX Error: File" in line and ".sty' not found" in line:
            package_error = True
            error_lines.append(line)
        # Font errors
        elif "! Font" in line or "! LaTeX Error: Font" in line:
            font_error = True
            error_lines.append(line)
        # General errors
        elif '!' in line or 'Error' in line or 'Fatal' in line:
            syntax_error = True
            error_lines.append(line)
    
    if package_error:
        error_details += "\nMissing LaTeX package detected. Please check if all required packages are installed."
    if font_error:
        error_details += "\nFont-related error detected. Please check if all required fonts are installed."
    if syntax_error:
        error_details += "\nLaTeX syntax error detected. Please check your LaTeX code."
    
    if error_lines:
        error_details += "\n\nDetailed errors:\n" + '\n'.join(error_lines)
    else:
        error_details += "\n" + log_content
    
    return error_details

@app.route('/latex-to-pdf', methods=['POST', 'OPTIONS'])
def latex_to_pdf_route():
    if request.method == 'OPTIONS':
        return handle_preflight()
    try:
        # Ensure we have JSON data
        if not request.is_json:
            return jsonify({
                'error': 'Invalid Content-Type',
                'details': 'Request must be application/json',
                'type': 'ContentTypeError'
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No JSON data provided',
                'details': 'Request body is empty',
                'type': 'EmptyRequestError'
            }), 400
            
        latex_content = data.get('latex')
        if not latex_content:
            return jsonify({
                'error': 'No LaTeX content provided',
                'details': 'latex field is required in request body',
                'type': 'ValidationError'
            }), 400

        # Create a temporary directory for LaTeX compilation
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write LaTeX content to a temporary file
            tex_file = Path(temp_dir) / "document.tex"
            tex_file.write_text(latex_content)

            try:
                # Run pdflatex twice to resolve references
                for i in range(2):
                    process = subprocess.run(
                        [
                            'pdflatex',
                            '-interaction=nonstopmode',
                            '-halt-on-error',
                            '-file-line-error',
                            tex_file.name
                        ],
                        cwd=temp_dir,
                        capture_output=True,
                        text=True
                    )
                    
                    # Check for compilation errors
                    if process.returncode != 0:
                        # Read the log file if it exists
                        log_file = Path(temp_dir) / "document.log"
                        
                        if log_file.exists():
                            log_content = log_file.read_text()
                            error_details = parse_latex_error(log_content)
                        else:
                            error_details = process.stderr if process.stderr else process.stdout
                        
                        print(f"LaTeX compilation failed (attempt {i+1}):")
                        print(error_details)
                        
                        return jsonify({
                            'error': 'LaTeX compilation failed',
                            'details': error_details,
                            'type': 'CompilationError'
                        }), 500

                # Read the generated PDF
                pdf_file = Path(temp_dir) / "document.pdf"
                if not pdf_file.exists():
                    return jsonify({
                        'error': 'PDF generation failed',
                        'details': 'PDF file was not created',
                        'type': 'CompilationError'
                    }), 500

                # Return PDF directly
                pdf_content = pdf_file.read_bytes()
                response = Response(pdf_content, mimetype='application/pdf')
                response = add_cors_headers(response)
                return response

            except Exception as e:
                error_info = capture_full_error()
                return jsonify({
                    'error': 'LaTeX compilation error',
                    'details': str(e),
                    'traceback': error_info['traceback'],
                    'type': 'CompilationError'
                }), 500

    except json.JSONDecodeError as e:
        return jsonify({
            'error': 'Invalid JSON data',
            'details': str(e),
            'type': 'JSONDecodeError'
        }), 400
    except Exception as e:
        error_info = capture_full_error()
        return jsonify({
            'error': 'Unexpected error',
            'details': str(e),
            'type': error_info['error_type'],
            'traceback': error_info['traceback']
        }), 500

def scrape_jobs(request):
    """
    Scrape job details from provided URLs.
    Request format:
    {
        "urls": ["url1", "url2", ...],
        "prompt": "Optional custom prompt"
    }
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'urls' not in request_json:
            return json.dumps({"error": "No URLs provided"}), 400

        source_urls = request_json['urls']
        user_prompt = request_json.get('prompt', '')

        # Enhanced prompt for job scraping
        enhanced_prompt = f"""
        Perform a comprehensive, structured extraction of job listing details with maximum precision:

        1. Job Identification:
        - Extract exact job title
        - Identify hiring company name
        - Capture company industry/sector

        2. Job Overview:
        - Provide a concise 2-3 sentence summary of the job's core purpose
        - Clearly state job type: Full-time / Part-time / Contract / Casual / Internship
        - Specify work location: On-site / Remote / Hybrid
        - Indicate geographic location (city, state, country)

        3. Compensation & Benefits:
        - Extract salary range or compensation details
        - List all mentioned benefits (health, retirement, stock options, etc.)
        - Note any signing bonuses or performance incentives

        4. Detailed Job Description:
        A. Job Responsibilities:
        - List ALL specific responsibilities in a clear, numbered format
        - Prioritize responsibilities from most to least critical
        - Use action verbs to describe each responsibility

        B. Job Requirements:
        - Specify minimum educational qualifications
        - List required years of experience
        - Enumerate technical skills
        - Highlight soft skills
        - Distinguish between 'required' and 'preferred' qualifications

        C. Preferred Qualifications:
        - Additional skills that would make a candidate stand out
        - Advanced certifications
        - Specialized knowledge or experience

        5. Additional Context:
        - Company culture insights
        - Growth opportunities
        - Reporting structure
        - Potential career progression

        6. Application Details:
        - Application deadline
        - How to apply
        - Required application materials

        Extraction Guidelines:
        - Be extremely precise and factual
        - Extract ONLY information directly present in the job listing
        - If information is missing, clearly state 'Not specified'
        - Maintain the original language and tone of the job listing

        Original User Prompt: {user_prompt}
        """

        # Configure the scraper with explicit browser configuration
        graph_config = {
            "llm": {
                "api_key": os.getenv("OPENAI_APIKEY"),
                "model": "openai/gpt-4-mini",
            },
            "verbose": True,
            "headless": True,  # Changed to True for Cloud Run environment
            "browser": {
                "type": "playwright",
                "options": {
                    "wait_until": "networkidle",
                    "timeout": 60000,
                    "chromium_args": [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-software-rasterizer",
                        "--headless=new"
                    ]
                }
            },
            "max_retries": 3,
        }

        # Initialize output structure
        output_data = {
            "input": {
                "urls": source_urls,
                "prompt": user_prompt
            },
            "results": {}
        }

        # Process each URL
        for idx, source_url in enumerate(source_urls, 1):
            result_key = f"result{idx}"
            url_output = {
                "url": source_url,
                "result": None,
                "error": None
            }

            try:
                # Create a new scraper instance for each URL
                smart_scraper_graph = SmartScraperGraph(
                    prompt=enhanced_prompt,
                    source=source_url,
                    config=graph_config
                )

                result = smart_scraper_graph.run()
                
                # Convert result to JSON if it's not already
                if not isinstance(result, (dict, list)):
                    result = str(result)
                
                url_output["result"] = result

            except Exception as e:
                # Capture full error details
                error_details = capture_full_error()
                url_output["error"] = error_details

            # Add this URL's results to the overall output
            output_data["results"][result_key] = url_output

        # Return the results
        return json.dumps(output_data), 200

    except Exception as e:
        error_details = capture_full_error()
        return json.dumps({"error": str(e), "details": error_details}), 500

@app.route('/scrape-jobs', methods=['POST', 'OPTIONS'])
def scrape_jobs_route():
    if request.method == 'OPTIONS':
        return handle_preflight()
    response = scrape_jobs(request)
    return add_cors_headers(response)

@app.route('/', methods=['GET'])
def health_check():
    response = Response('OK', 200)
    return add_cors_headers(response)

if __name__ == "__main__":
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
