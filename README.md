# TurboTariff

TurboTariff is a smart tariff management system that helps with calculating customs duties, filling CBP forms, and tracking compliance dates.

## Features

- Upload packing lists via spreadsheets or manual entry
- AI-powered suggestions for HS codes and item descriptions
- Compliance date tracking with calendar integration
- Tariff calculation with detailed insights
- PDF form generation for customs documentation
- Risk assessment for tariff classification
- Batch PDF generation for multiple items

## Project Structure

The project consists of three main components:

1. A Next.js web application for the user interface (turbotariff folder)
2. A Python-based PDF generator for customs forms (code/pdf_writer folder)
3. A Flask server for tariff calculations (tariff_server.py)

## Quick Start

Use the start_servers script to quickly set up and run both frontend and backend servers:

```
./start_servers.sh
```

This script will check dependencies, set up virtual environments, install required packages, and start both servers automatically.

## Manual Setup and Installation

### Web Application (Next.js)

1. Navigate to the turbotariff directory:
   ```
   cd turbotariff
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

### Tariff Server (Flask)

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the Flask server:
   ```
   python tariff_server.py
   ```

### PDF Generator (Python)

1. Ensure virtual environment is activated (see above)

2. Run the PDF generator:
   ```
   cd code/pdf_writer
   python pdf_writer.py --input-pdf CBP_Form_7501.pdf --json-data simplified_input_example.json
   ```

   For multiple PDFs:
   ```
   python pdf_writer_multi.py --input-pdf CBP_Form_7501.pdf --json-data simplified_input_example.json
   ```

The completed form(s) will be saved in the output directory.

## Usage

1. Upload a packing list or enter details manually
2. Review and confirm the tariff calculations
3. Generate the completed CBP Form 7501
4. Download and submit the form to customs

For more detailed information, refer to the `SIMPLIFIED_INPUT_GUIDE.md` file.