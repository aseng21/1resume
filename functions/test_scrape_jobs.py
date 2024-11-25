import os
import json
import pytest
from unittest.mock import patch, MagicMock
from firebase_functions import https_fn
from main import scrape_jobs

# Load environment variables for testing
from dotenv import load_dotenv
load_dotenv()

@pytest.fixture
def mock_request():
    """Create a mock request with test data."""
    request = MagicMock(spec=https_fn.Request)
    request.method = 'POST'
    request.get_json.return_value = {
        "urls": ["https://example.com/job1", "https://example.com/job2"],
        "prompt": "Test prompt"
    }
    return request

@pytest.fixture
def mock_smart_scraper():
    """Mock the SmartScraperGraph class."""
    with patch('main.SmartScraperGraph') as mock:
        instance = mock.return_value
        instance.run.return_value = {
            "job_title": "Software Engineer",
            "company": "Test Company",
            "description": "Test job description"
        }
        yield mock

def test_scrape_jobs_invalid_method():
    """Test that non-POST requests are rejected."""
    request = MagicMock(spec=https_fn.Request)
    request.method = 'GET'
    
    response = scrape_jobs(request)
    
    assert response.status == 405
    data = json.loads(response.get_data())
    assert data['error'] == 'Only POST requests are supported'

def test_scrape_jobs_missing_urls():
    """Test that requests without URLs are rejected."""
    request = MagicMock(spec=https_fn.Request)
    request.method = 'POST'
    request.get_json.return_value = {}
    
    response = scrape_jobs(request)
    
    assert response.status == 400
    data = json.loads(response.get_data())
    assert data['error'] == 'No URLs provided'

def test_scrape_jobs_successful(mock_request, mock_smart_scraper):
    """Test successful job scraping."""
    response = scrape_jobs(mock_request)
    
    assert response.status == 200
    data = json.loads(response.get_data())
    
    # Check structure of response
    assert 'input' in data
    assert 'results' in data
    assert len(data['results']) == 2
    
    # Check first result
    result1 = data['results']['result1']
    assert result1['url'] == "https://example.com/job1"
    assert result1['result'] == {
        "job_title": "Software Engineer",
        "company": "Test Company",
        "description": "Test job description"
    }
    assert result1['error'] is None

def test_scrape_jobs_with_error(mock_request, mock_smart_scraper):
    """Test handling of scraping errors."""
    # Make the scraper raise an exception
    mock_smart_scraper.return_value.run.side_effect = Exception("Scraping failed")
    
    response = scrape_jobs(mock_request)
    
    assert response.status == 200  # Still returns 200 as it's a partial failure
    data = json.loads(response.get_data())
    
    # Check that error is captured in results
    result1 = data['results']['result1']
    assert result1['error'] is not None
    assert result1['error']['error_type'] == 'Exception'
    assert result1['error']['error_message'] == 'Scraping failed'

def test_scrape_jobs_missing_api_key():
    """Test handling of missing OpenAI API key."""
    with patch.dict(os.environ, {'OPENAI_APIKEY': ''}):
        request = MagicMock(spec=https_fn.Request)
        request.method = 'POST'
        request.get_json.return_value = {
            "urls": ["https://example.com/job1"],
            "prompt": "Test prompt"
        }
        
        response = scrape_jobs(request)
        data = json.loads(response.get_data())
        
        # The first result should have an error about missing API key
        result1 = data['results']['result1']
        assert result1['error'] is not None
        assert 'api_key' in result1['error']['error_message'].lower()
