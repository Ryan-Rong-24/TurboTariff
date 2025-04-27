# TurboTariff Server

This document describes how to set up and run the TurboTariff server, which provides HS code classification and tariff calculation functionality.

## Overview

The TurboTariff server is a Flask application that provides the following functionality:

1. **HS Code Search**: Uses BERT embeddings to find the correct Harmonized System code for product descriptions
2. **Tariff Calculation**: Calculates various tariffs applicable to imports from China:
   - Basic duty rates
   - Section 301 tariffs
   - IEEPA tariffs
   - Reciprocal tariffs
3. **PDF Generation**: Creates custom CBP Form 7501 PDFs for each item

## Requirements

1. Python 3.8 or higher
2. Libraries listed in requirements.txt
3. OpenAI API key (for steps 4 and 5)
4. Chrome WebDriver (for step 3)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/username/TurboTariff.git
   cd TurboTariff
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Running the Server

1. Start the Flask server:
   ```
   python tariff_server.py
   ```

2. The server will run on http://localhost:5001 by default.

3. Test that the server is running correctly:
   ```
   curl http://localhost:5001/api/health
   ```

## Integration with Next.js Frontend

The Next.js frontend communicates with the tariff server through several components:

1. **HsCodeSearch**: Enables users to search for HS codes by product description
2. **TariffCalculator**: Guides users through tariff calculation for each item
3. **TariffFormModuleEnhanced**: Manages the overall form creation process

### API Endpoints

The following endpoints are available:

1. **POST /api/search-hs-code**: Search for HS codes by product description
2. **POST /api/calculate-section-301**: Calculate Section 301 tariff for an HS code
3. **POST /api/calculate-ieepa**: Calculate IEEPA tariff for an HS code
4. **POST /api/calculate-reciprocal**: Calculate reciprocal tariff for an HS code
5. **POST /api/calculate-all-tariffs**: Calculate all tariffs for an HS code
6. **POST /api/generate-form**: Generate CBP forms for a list of items
7. **GET /api/health**: Check server health status

## Usage Flow

1. User uploads a packing list or creates items manually
2. For each item, the system:
   - Helps the user find the correct HS code using BERT embeddings
   - Calculates applicable tariffs for the selected HS code
   - Displays detailed tariff sources and explanations
3. After all items are processed, the system:
   - Generates a CBP Form 7501 for each item
   - Provides download links for all forms
   - Shows a summary of all tariff calculations

## Tariff Rate Integration in CBP Forms

The CBP Form 7501 has specific sections for different tariff types that need to be correctly filled:

1. **A. HTSUS Rate**: The base duty rate calculated from the HS code (from Harmonized Tariff Schedule)
2. **B. AD/CVD Rate**: Section 301 tariffs applicable to imports from certain countries
3. **C. IRC Rate**: Combined rate of IEEPA and Reciprocal tariffs

These rates are displayed in the PDF form field `descriptionc1[1]` in this format:
```
A: {basic_duty_rate}% B: {section_301_rate}% C: {other_rate}%
```

### Data Flow for Tariff Rates

The tariff rates flow through the system as follows:

1. Frontend calculation:
   - `TariffCalculator` component calls `http://localhost:5001/api/calculate-all-tariffs`
   - The response contains `general_rate`, `section_301_rate`, `ieepa_rate`, and `reciprocal_rate`

2. Data mapping for PDF generation:
   - `basic_duty_rate` = `general_rate` (Section A: HTSUS Rate) 
   - `section_301_rate` = `section_301_rate` (Section B: AD/CVD Rate)
   - `other_rate` = `ieepa_rate` + `reciprocal_rate` (Section C: IRC Rate)

3. PDF generation:
   - The `pdf_writer_multi.py` script uses these values to calculate duty amounts
   - Rates are displayed in the form with clear section labeling (A, B, C)

## Troubleshooting

- **Server won't start**: Check Python version and installed dependencies.
- **HS code search not working**: Ensure the BERT embeddings file (`htsdata_embedding_sbert.jsonl`) is in the correct location.
- **Section 301 tariff calculation fails**: Make sure Chrome WebDriver is installed and compatible with your Chrome version.
- **IEEPA or reciprocal tariff calculation fails**: Verify your OpenAI API key is correct in the `.env` file.
- **PDF generation fails**: Check that the CBP Form 7501 template is available in the `code/pdf_writer/` directory.

## Development

To modify or extend the tariff server:

1. The main server file is `tariff_server.py`
2. HS code search uses `step1.py` and the BERT embeddings
3. Section 301 tariff calculation uses `step3.py`
4. IEEPA tariff calculation uses `step4.py`
5. Reciprocal tariff calculation uses `step5.py`
6. PDF generation uses the `pdf_writer_multi.py` script