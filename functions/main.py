import os
import json
import traceback
import tempfile
import subprocess
from pathlib import Path
from firebase_admin import initialize_app
from flask import Flask, Response, request, jsonify
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
    
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

def handle_preflight():
    """Handle CORS preflight requests."""
    response = Response()
    response = add_cors_headers(response)
    return response

@app.route('/latex-to-pdf', methods=['POST', 'OPTIONS'])
def latex_to_pdf_route():
    if request.method == 'OPTIONS':
        return handle_preflight()
    try:
        data = request.get_json()
        latex_content = data.get('latex')
        
        if not latex_content:
            return jsonify({'error': 'No LaTeX content provided'}), 400

        # Call LaTeX.Online API
        response = requests.post(
            'https://latexonline.cc/compile',
            data=latex_content.encode('utf-8'),
            headers={'Content-Type': 'application/x-latex'}
        )

        if response.status_code != 200:
            return jsonify({'error': 'PDF generation failed', 'details': response.text}), 500

        # Return PDF as base64
        pdf_base64 = base64.b64encode(response.content).decode('utf-8')
        return jsonify({'pdf': pdf_base64})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
