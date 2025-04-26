#!/usr/bin/env python3
"""
Adapter script to bridge between the TurboTariff web app and the PDF writer.
Converts the web app's item list format to the simplified input format expected by pdf_writer.py.
"""

import json
import sys
import os
import argparse

def convert_items_to_input(items_data):
    """
    Convert a list of items from the web app to the simplified input format.
    
    Args:
        items_data (list): List of item dictionaries from the web app
        
    Returns:
        dict: A single object with the simplified input format expected by pdf_writer.py
    """
    if not items_data or not isinstance(items_data, list):
        raise ValueError("Input must be a non-empty list of items")
    
    # Use the first item for basic info
    first_item = items_data[0]
    
    # Calculate total value (simple estimate based on weight)
    total_value = sum(item.get('weight', 0) * 10 for item in items_data)
    
    # Get HS code from first item, or use default
    hs_code = first_item.get('hsCode', '')
    if not hs_code:
        hs_code = "9999.00.0000"  # Default if no HS code provided
    
    # Create a comma-separated list of all item descriptions
    descriptions = ", ".join(item.get('description', '') for item in items_data if item.get('description'))
    
    # Set up the simplified input
    simplified_input = {
        "hts_number": hs_code,
        "country_of_origin": "CN",  # Default to China
        "description": descriptions[:80],  # Limit to reasonable length
        "value": str(total_value),
        "basic_duty_rate": "2.5",  # Default duty rate
        "section_301_rate": "7.5",  # Default Section 301 tariff rate
        "other_rate": "0"  # Default other fees rate
    }
    
    return simplified_input

def main():
    parser = argparse.ArgumentParser(description='Convert web app items to simplified input format')
    parser.add_argument('--input', required=True, help='Input JSON file with items list')
    parser.add_argument('--output', required=True, help='Output JSON file for simplified format')
    
    args = parser.parse_args()
    
    try:
        # Read the input file
        with open(args.input, 'r') as f:
            items_data = json.load(f)
        
        # Convert to simplified format
        simplified_input = convert_items_to_input(items_data)
        
        # Write the output file
        with open(args.output, 'w') as f:
            json.dump(simplified_input, f, indent=2)
            
        print(f"Successfully converted {len(items_data)} items to simplified format")
        print(f"Output written to {args.output}")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()