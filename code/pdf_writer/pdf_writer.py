#!/usr/bin/env python3
"""
Customs Calculator - A program to calculate customs duties and fees and fill PDF forms.
Takes simplified input with just the essential variables and calculates all derived values.
"""

import PyPDF2
import os
import json
import argparse
from datetime import datetime


def calculate_duties_and_fees(input_data):
    """
    Calculate all duties and fees based on the input data.
    
    Args:
        input_data (dict): Dictionary containing the essential input variables
    
    Returns:
        dict: Complete dictionary with all calculated values for the PDF form
    """
    # Extract input values
    hts_number = input_data.get("hts_number", "")
    description = input_data.get("description", "")
    value = float(input_data.get("value", 0))
    basic_duty_rate = float(input_data.get("basic_duty_rate", 0)) / 100  # Convert percentage to decimal
    section_301_rate = float(input_data.get("section_301_rate", 0)) / 100  # Convert percentage to decimal
    other_rate = float(input_data.get("other_rate", 0)) / 100  # Convert percentage to decimal
    
    # Additional inputs with defaults
    gross_weight = input_data.get("gross_weight", "10.00")
    manifest_qty = input_data.get("manifest_qty", "100")
    net_quantity = input_data.get("net_quantity", "100")
    # htsus_units = input_data.get("htsus_units", "PCS")
    
    # Set default values for removed fields
    country_of_origin = "CN"  # Default to China
    relationship_code = "N"   # Default to No relationship
    
    # Calculate duty amounts
    basic_duty = value * basic_duty_rate
    section_301 = value * section_301_rate
    other_fees = value * other_rate
    total_duty = basic_duty + section_301 + other_fees
    
    # Calculate Merchandise Processing Fee (MPF) - 0.3464% of value, min $29.66, max $575.16
    mpf = value * 0.003464
    mpf = max(29.66, min(mpf, 575.16))
    
    # Calculate Harbor Maintenance Fee (HMF) - 0.125% of value
    hmf = value * 0.00125
    
    # Total other fees
    total_other_fees = mpf + hmf
    
    # Total payable
    total_payable = total_duty + total_other_fees
    
    # Format all numeric values to 2 decimal places
    basic_duty_str = f"{basic_duty:.2f}"
    section_301_str = f"{section_301:.2f}"
    other_fees_str = f"{other_fees:.2f}"
    total_duty_str = f"{total_duty:.2f}"
    mpf_str = f"{mpf:.2f}"
    hmf_str = f"{hmf:.2f}"
    total_other_fees_str = f"{total_other_fees:.2f}"
    total_payable_str = f"{total_payable:.2f}"
    value_str = f"{value:.2f}"
    
    # Current date
    today = "TODAY"
    
    # Create complete form data dictionary with constants and calculated values
    form_data = {
        # Entry Information (Constants)
        "filercode[0]": "ABC",
        "entrytype[0]": "01",
        "summaryDate[0]": today,
        "portcode[0]": "2704",
        "entryDate[0]": today,
        "importDate[0]": today,
        
        # Bond Information (Constants)
        "bondtype[0]": "1",
        "suretyno[0]": "123",
        
        # Transportation Information (Constants)
        "mode[0]": "11",
        "impcarrier[0]": "ABCD",
        "bl[0]": "SHIP12345678",
        "manid[0]": "CNLIP123456789",
        "foreignport[0]": "CNSHA",
        "usport[0]": "2704",
        
        # Importer/Consignee Information (Constants)
        "importerno[0]": "12-3456789",
        "consignno[0]": "12-3456789",
        "refno[0]": f"PO-{datetime.now().strftime('%Y-%m%d')}",
        
        # Importer Address (Constants)
        "ultimateaddress1[0]": "XYZ COSMETICS IMPORT CO.",
        "ultimateaddress1[1]": "123 BEAUTY BLVD",
        "ultimateaddress1[2]": "",
        "city1[0]": "NEW YORK",
        "State[0]": "NY",
        "zip1[0]": "10001",
        
        # Consignee Address (Constants)
        "importeraddress2[0]": "XYZ COSMETICS IMPORT CO.",
        "importeraddress2[1]": "123 BEAUTY BLVD",
        "importeraddress2[2]": "",
        "city2[0]": "NEW YORK",
        "State[1]": "NY",
        "zip2[0]": "10001",
        
        # Column 28: Description of Merchandise
        "lineno1[0]": "001",  # Line number
        "descriptiona1[0]": description,  # Column 28A: HTSUS No. # Country of Origin
        # "descriptionc1[0]": ,  # Description of goods
        
        # Note: For columns 29-34, we'll add information to the description fields
        # since the form doesn't have specific fields for these columns
        "descriptiona1[1]": f"Gross Weight: {gross_weight} kg",  # Column 29A
        "descriptionb1[1]": f"{value_str}  {relationship_code}",  # Column 29B
        # Format for CBP Form 7501:
        # Section A: HTSUS Rate (Basic duty rate)
        # Section B: AD/CVD Rate (Section 301)
        # Section C: IRC Rate (IEEPA + Reciprocal)
        "descriptionc1[1]": f"A: {basic_duty_rate*100:.1f}% B: {section_301_rate*100:.1f}% C: {other_rate*100:.1f}% ",

        # Column 31: Entered Value is already handled with amount1[0]
        # "descriptiona1[2]": f"Relationship: {relationship_code}",  # Column 31C
        
        # Column 32-33: Rate Information
        # "descriptionb1[2]": basic_duty_str,  # Column 32A
        #"descriptionc1[2]": f"",  # Column 33B/C
        
        # Use existing amount fields for other entries
        # "amount1[0]": value_str,  # Column 31A: Entered Value
        
        # Duty and Fee Calculations (Calculated)
        "duty37[0]": total_duty_str,
        "tax38[0]": f'0.0',
        "other39[0]": total_other_fees_str,
        "total40[0]": total_payable_str,
        
        # Other Fees (Calculated)
        "descriptiona1[1]": f"{hts_number}                   {gross_weight}kg    {manifest_qty}             {net_quantity}",
        "amount1[1]": total_duty_str,
        "descriptiona1[2]": "Merchandise Processing Fee",
        "amount1[2]": mpf_str,
        "descriptiona1[3]": "Harbor Maintenance Fee",
        "amount1[3]": hmf_str,
        "totalotherfees[0]": total_other_fees_str,
        "total35[0]": value_str,
        
        # Declaration (Constants)
        "decname[0]": "John Smith",
        "title[0]": "Import Manager",
        "lstdate[0]": today,
        "brokerinfo[0]": "XYZ CUSTOMS BROKERS",
        "brokernumber[0]": "ABC-123"
    }
    
    return form_data


def fill_pdf_form(input_pdf_path, output_pdf_path, form_data):
    """
    Fill a PDF form with the provided data.
    
    Args:
        input_pdf_path (str): Path to the input PDF form
        output_pdf_path (str): Path where the filled PDF will be saved
        form_data (dict): Dictionary containing form field names and values
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create a PDF reader and writer
        reader = PyPDF2.PdfReader(input_pdf_path)
        writer = PyPDF2.PdfWriter()
        
        # Get the first page
        page = reader.pages[0]
        writer.add_page(page)
        
        # Get available form fields
        available_fields = reader.get_fields()
        
        # Update form fields
        for field, value in form_data.items():
            if field in available_fields:
                writer.update_page_form_field_values(writer.pages[0], {field: value})
            else:
                print(f"Warning: Field '{field}' not found in the form")
        
        # Save the filled form
        with open(output_pdf_path, 'wb') as output_file:
            writer.write(output_file)
        
        return True
    
    except Exception as e:
        print(f"Error filling PDF form: {str(e)}")
        return False


def load_json_data(json_path):
    """
    Load input data from a JSON file.
    
    Args:
        json_path (str): Path to the JSON file
    
    Returns:
        dict: Input data as a dictionary
    """
    try:
        with open(json_path, 'r') as file:
            data = json.load(file)
        return data
    except Exception as e:
        print(f"Error loading JSON data: {str(e)}")
        return None


def process_date_fields(form_data):
    """
    Process any date fields marked as TODAY.
    
    Args:
        form_data (dict): Form data dictionary
    
    Returns:
        dict: Updated form data with processed date fields
    """
    for field, value in form_data.items():
        if value == "TODAY":
            form_data[field] = datetime.now().strftime('%m/%d/%Y')
    
    return form_data


def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Calculate customs duties and fees and fill PDF forms')
    parser.add_argument('--input-pdf', required=True, help='Path to the input PDF form')
    parser.add_argument('--output-pdf', help='Path where the filled PDF will be saved')
    parser.add_argument('--json-data', required=True, help='Path to the JSON file with input data')
    
    args = parser.parse_args()
    
    # Set default output path if not provided
    output_pdf = args.output_pdf
    if not output_pdf:
        base_name = os.path.basename(args.input_pdf)
        name, ext = os.path.splitext(base_name)
        # Create output directory if it doesn't exist
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "output")
        os.makedirs(output_dir, exist_ok=True)
        output_pdf = os.path.join(output_dir, f"Completed_{name}{ext}")
    
    # Load data from JSON
    input_data = load_json_data(args.json_data)
    if not input_data:
        return
    
    # Calculate all duties, fees, and form values
    form_data = calculate_duties_and_fees(input_data)
    
    # Process date fields
    form_data = process_date_fields(form_data)
    
    # Fill the PDF form
    success = fill_pdf_form(args.input_pdf, output_pdf, form_data)
    
    '''
    if success:
        print(f"Completed form created at: {output_pdf}")
        print("Summary of calculations:")
        print(f"  Value: ${input_data.get('value', '0')}")
        print(f"  Basic Duty ({input_data.get('basic_duty_rate', '0')}%): ${form_data['duty37[0]']}")
        #print(f"  Section 301 ({input_data.get('section_301_rate', '0')}%): ${form_data['tax38[0]']}")
        print(f"  Other Fees ({input_data.get('other_rate', '0')}%): ${form_data['other39[0]']}")
        print(f"  Merchandise Processing Fee: ${form_data['amount1[1]']}")
        print(f"  Harbor Maintenance Fee: ${form_data['amount1[2]']}")
        print(f"  Total Payable: ${form_data['total35[0]']}")
    else:
        print("Failed to create completed form")
    '''

if __name__ == "__main__":
    main()
