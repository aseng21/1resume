import os
import json
import traceback
import sys
from dotenv import load_dotenv
from scrapegraphai.graphs import SmartScraperGraph
from scrapegraphai.utils import prettify_exec_info

def capture_full_error():
    """Capture full error details including traceback."""
    exc_type, exc_value, exc_traceback = sys.exc_info()
    return {
        "error_type": str(exc_type.__name__),
        "error_message": str(exc_value),
        "traceback": traceback.format_exc()
    }

load_dotenv()

openai_key = os.getenv("OPENAI_APIKEY")

graph_config = {
   "llm": {
      "api_key": openai_key,
      "model": "openai/gpt-4o-mini",
   },
   "verbose": True,
   "headless": False,  # Kept as False due to Indeed's specific scraping challenges
   "browser": {
       "type": "playwright",  # Use Playwright for better dynamic content handling
       "options": {
           "wait_until": "networkidle",  # Wait for network to be idle
           "timeout": 60000,  # Increase timeout to 60 seconds
       }
   },
   "max_retries": 3,  # Add retry mechanism
}

# ************************************************
# Interactively get URLs and prompt from user
# ************************************************
print("Enter URLs to scrape (press Enter without typing to finish):")
source_urls = []
while True:
    url = input("URL: ").strip()
    if url == "":
        break
    source_urls.append(url)

# Check if any URLs were entered
if not source_urls:
    print("No URLs entered. Exiting.")
    sys.exit(1)

user_prompt = input("Enter the prompt for scraping: ")

# Comprehensive enhanced prompt for job scraping
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

# ************************************************
# Create the SmartScraperGraph instances and run them
# ************************************************
output_data = {
    "input": {
        "urls": source_urls,
        "prompt": user_prompt
    },
    "results": {}  # Changed to a dictionary for named results
}

# Iterate through URLs with enumeration
for idx, source_url in enumerate(source_urls, 1):
    result_key = f"result{idx}"
    url_output = {
        "url": source_url,
        "result": None,
        "error": None
    }

    try:
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

    # Add this URL's results to the overall output with a unique key
    output_data["results"][result_key] = url_output

# Print result to console
print(json.dumps(output_data, indent=2))

# Write result to JSON file
with open('outputs.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2)

# Re-raise the last exception if any URL scraping failed
for result_key, result in output_data["results"].items():
    if result["error"]:
        raise Exception(f"Scraping failed for {result['url']} ({result_key}): {result['error']}")
