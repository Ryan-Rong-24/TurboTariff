#!/usr/bin/env python3
"""
TurboTariff Flask Server

This server provides API endpoints for:
1. Searching for HS codes based on product descriptions using BERT embeddings
2. Calculating tariffs for selected HS codes
3. Generating custom forms for tariff data
"""

import os
import json
import re
import time
import subprocess
import tempfile
from typing import List, Dict, Any, Optional
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Global variables
EMBEDDINGS_PATH = os.path.join(os.path.dirname(__file__), "htsdata_embedding_sbert.jsonl")
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI client if API key is available
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize the model and embeddings at startup
print("Loading SBERT model and embeddings...")
start_time = time.time()
model = SentenceTransformer("all-mpnet-base-v2")
hts_data = []

def load_hts_embeddings():
    """Load HTS embeddings from JSONL file"""
    global hts_data
    with open(EMBEDDINGS_PATH, "r") as f:
        hts_data = [json.loads(line) for line in f if "embedding" in json.loads(line)]
    print(f"Loaded {len(hts_data)} HTS codes with embeddings")

# Load embeddings when server starts
load_hts_embeddings()
print(f"Model and embeddings loaded in {time.time() - start_time:.2f} seconds")

def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def extract_rate(text):
    """Extract percentage rate from text"""
    match = re.search(r'(\d+(\.\d+)?)\s*%', text)
    if match:
        return float(match.group(1))
    else:
        return 0

@app.route('/api/search-hs-code', methods=['POST'])
def search_hs_code():
    """
    Search for HS codes based on product description
    
    Request JSON:
    {
        "description": "product description",
        "top_n": 10  # Optional, default is 10
    }
    """
    data = request.get_json()
    
    if not data or 'description' not in data:
        return jsonify({"error": "Missing product description"}), 400
    
    product_desc = data.get('description')
    top_n = data.get('top_n', 10)
    
    # Convert description to embedding
    product_desc_vec = model.encode(product_desc)
    
    # Rank by similarity
    scored = [(cosine_similarity(product_desc_vec, np.array(item["embedding"])), item) for item in hts_data]
    top_matches = sorted(scored, key=lambda x: -x[0])[:top_n]
    
    results = []
    for score, match in top_matches:
        hs_code = match['htsno']
        desc = match['description']
        general_rate = extract_rate(match['general'])
        
        results.append({
            "hs_code": hs_code,
            "description": desc,
            "general_rate": general_rate,
            "similarity_score": float(score)
        })
    
    return jsonify({"results": results})

@app.route('/api/calculate-section-301', methods=['POST'])
def calculate_section_301():
    """
    Calculate Section 301 tariff rate for an HS code
    
    Request JSON:
    {
        "hs_code": "0101.21.0000"
    }
    """
    data = request.get_json()
    
    if not data or 'hs_code' not in data:
        return jsonify({"error": "Missing HS code"}), 400
    
    hs_code = data.get('hs_code')
    
    try:
        # Call step3.py to get Section 301 tariff rate
        process = subprocess.run(
            ["python3", "step3.py", "--query", hs_code],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse the output
        section_301_rate = int(process.stdout.strip())
        
        return jsonify({
            "hs_code": hs_code,
            "section_301_rate": section_301_rate
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": f"Failed to calculate Section 301 tariff: {e.stderr}",
            "section_301_rate": 0
        }), 500

@app.route('/api/calculate-ieepa', methods=['POST'])
def calculate_ieepa():
    """
    Calculate IEEPA tariff rate for an HS code
    
    Request JSON:
    {
        "hs_code": "0101.21.0000"
    }
    """
    data = request.get_json()
    
    if not data or 'hs_code' not in data:
        return jsonify({"error": "Missing HS code"}), 400
    
    hs_code = data.get('hs_code')
    
    if not openai_client:
        return jsonify({
            "error": "OpenAI API key not configured",
            "ieepa_rate": 0
        }), 500
    
    try:
        # Call step4.py to get IEEPA tariff rate
        process = subprocess.run(
            ["python3", "step4.py", "--hs_code", hs_code],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse the output
        ieepa_rate = int(process.stdout.strip())
        
        return jsonify({
            "hs_code": hs_code,
            "ieepa_rate": ieepa_rate
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": f"Failed to calculate IEEPA tariff: {e.stderr}",
            "ieepa_rate": 0
        }), 500

@app.route('/api/calculate-reciprocal', methods=['POST'])
def calculate_reciprocal():
    """
    Calculate reciprocal tariff rate for an HS code
    
    Request JSON:
    {
        "hs_code": "0101.21.0000"
    }
    """
    data = request.get_json()
    
    if not data or 'hs_code' not in data:
        return jsonify({"error": "Missing HS code"}), 400
    
    hs_code = data.get('hs_code')
    
    if not openai_client:
        return jsonify({
            "error": "OpenAI API key not configured",
            "reciprocal_rate": 0
        }), 500
    
    try:
        # Call step5.py to get reciprocal tariff rate
        process = subprocess.run(
            ["python3", "step5.py", "--hs_code", hs_code],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse the output, get the last line which should be the rate
        output_lines = process.stdout.strip().split('\n')
        reciprocal_rate = int(output_lines[-1])
        
        # Get the detailed explanation from the output (everything except the last line)
        explanation = '\n'.join(output_lines[:-1])
        
        return jsonify({
            "hs_code": hs_code,
            "reciprocal_rate": reciprocal_rate,
            "explanation": explanation
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": f"Failed to calculate reciprocal tariff: {e.stderr}",
            "reciprocal_rate": 0
        }), 500

@app.route('/api/calculate-all-tariffs', methods=['POST'])
def calculate_all_tariffs():
    """
    Calculate all tariff rates for an HS code
    
    Request JSON:
    {
        "hs_code": "0101.21.0000",
        "description": "Live purebred breeding horses",
        "country_of_origin": "CN"
    }
    """
    data = request.get_json()
    
    if not data or 'hs_code' not in data:
        return jsonify({"error": "Missing HS code"}), 400
    
    hs_code = data.get('hs_code')
    description = data.get('description', '')
    country = data.get('country_of_origin', 'CN')
    
    # Only process for China imports
    if country != 'CN':
        return jsonify({
            "hs_code": hs_code,
            "country_of_origin": country,
            "general_rate": 0,
            "section_301_rate": 0,
            "ieepa_rate": 0,
            "reciprocal_rate": 0,
            "total_rate": 0,
            "status": "Only China imports are supported for tariff calculation"
        })
    
    result = {
        "hs_code": hs_code,
        "description": description,
        "country_of_origin": country,
        "general_rate": 0,
        "section_301_rate": 0,
        "ieepa_rate": 0,
        "reciprocal_rate": 0,
        "total_rate": 0,
        "tariff_sources": []
    }
    
    # Get general rate from embeddings
    for item in hts_data:
        if item['htsno'] == hs_code:
            result["general_rate"] = extract_rate(item['general'])
            result["tariff_sources"].append({
                "name": "Basic duty rate",
                "rate": result["general_rate"],
                "source": "Harmonized Tariff Schedule"
            })
            break
    
    # Calculate Section 301 tariff
    try:
        response = calculate_section_301().get_json()
        result["section_301_rate"] = response.get("section_301_rate", 0)
        if result["section_301_rate"] > 0:
            result["tariff_sources"].append({
                "name": "Section 301 tariff",
                "rate": result["section_301_rate"],
                "source": "USTR Section 301 Investigation"
            })
    except Exception as e:
        print(f"Error calculating Section 301 tariff: {e}")
    
    # Calculate IEEPA tariff
    try:
        response = calculate_ieepa().get_json()
        result["ieepa_rate"] = response.get("ieepa_rate", 0)
        if result["ieepa_rate"] > 0:
            result["tariff_sources"].append({
                "name": "IEEPA tariff",
                "rate": result["ieepa_rate"],
                "source": "International Emergency Economic Powers Act"
            })
    except Exception as e:
        print(f"Error calculating IEEPA tariff: {e}")
    
    # Calculate reciprocal tariff
    try:
        response = calculate_reciprocal().get_json()
        result["reciprocal_rate"] = response.get("reciprocal_rate", 0)
        result["reciprocal_explanation"] = response.get("explanation", "")
        if result["reciprocal_rate"] > 0:
            result["tariff_sources"].append({
                "name": "Reciprocal tariff",
                "rate": result["reciprocal_rate"],
                "source": "Reciprocal Tariff Act"
            })
    except Exception as e:
        print(f"Error calculating reciprocal tariff: {e}")
    
    # Calculate total tariff rate
    result["total_rate"] = (
        result["general_rate"] +
        result["section_301_rate"] +
        result["ieepa_rate"] +
        result["reciprocal_rate"]
    )
    
    result["status"] = "success"
    return jsonify(result)

@app.route('/api/generate-form', methods=['POST'])
def generate_tariff_form():
    """
    Generate a tariff form for multiple items
    
    Request JSON:
    {
        "items": [
            {
                "id": "item-1",
                "hts_number": "9401.61.0000",
                "country_of_origin": "CN",
                "description": "Three-seater sofa with removable cushions",
                "value": "5100",
                "basic_duty_rate": "2.5",
                "section_301_rate": "7.5",
                "other_rate": "0",
                "gross_weight": "75.50",
                "manifest_qty": "1",
                "net_quantity": "1"
            }
        ]
    }
    """
    data = request.get_json()
    
    if not data or 'items' not in data or not isinstance(data['items'], list):
        return jsonify({"error": "Missing or invalid items data"}), 400
    
    items = data['items']
    
    # Save items to temporary file
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as temp_file:
        json.dump(items, temp_file)
        temp_path = temp_file.name
    
    try:
        # Get the path to the PDF writer script and template
        script_dir = os.path.dirname(os.path.abspath(__file__))
        pdf_writer_path = os.path.join(script_dir, "code", "pdf_writer", "pdf_writer_multi.py")
        template_path = os.path.join(script_dir, "code", "pdf_writer", "CBP_Form_7501.pdf")
        output_dir = os.path.join(script_dir, "output")
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Run the PDF writer script
        process = subprocess.run(
            [
                "python3",
                pdf_writer_path,
                "--input-pdf", template_path,
                "--json-data", temp_path,
                "--output-dir", output_dir
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse the output to find generated PDFs
        output = process.stdout.strip()
        pdf_paths = []
        
        for line in output.split('\n'):
            if line.startswith('- '):
                pdf_path = line[2:]
                pdf_name = os.path.basename(pdf_path)
                pdf_paths.append({
                    "path": pdf_path,
                    "name": pdf_name,
                    "url": f"/output/{pdf_name}"
                })
        
        return jsonify({
            "status": "success",
            "message": f"Generated {len(pdf_paths)} tariff forms",
            "pdf_files": pdf_paths
        })
    
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": f"Failed to generate tariff form: {e.stderr}"
        }), 500
    
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the server is running"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "embeddings_loaded": len(hts_data) > 0,
        "openai_available": openai_client is not None
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)