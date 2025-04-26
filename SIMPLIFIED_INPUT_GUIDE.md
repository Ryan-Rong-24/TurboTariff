# Simplified Input Guide for Customs Calculator

This guide explains the simplified input format for the customs calculator program.

## Input Variables

The simplified input JSON file requires only the essential variables needed to calculate customs duties and fees:

| Field | Description | Example | Format |
|-------|-------------|---------|--------|
| `hts_number` | Harmonized Tariff Schedule classification code | `"3304.10.0000"` | String |
| `country_of_origin` | ISO country code for origin | `"CN"` (China) | String, 2-letter ISO code |
| `description` | Description of the goods | `"Lip make-up preparations (Lipstick)"` | String |
| `value` | Entered value in USD | `"10000.00"` | String, numeric with 2 decimal places |
| `basic_duty_rate` | Basic duty rate percentage | `"0"` | String, percentage without % symbol |
| `section_301_rate` | Section 301 tariff rate percentage | `"7.5"` | String, percentage without % symbol |
| `other_rate` | Other fees rate percentage | `"145"` | String, percentage without % symbol |

## Example Input File

```json
{
  "hts_number": "3304.10.0000",
  "country_of_origin": "CN",
  "description": "Lip make-up preparations (Lipstick)",
  "value": "10000.00",
  "basic_duty_rate": "0",
  "section_301_rate": "7.5",
  "other_rate": "145"
}
```

## Calculated Values

The program automatically calculates the following values based on your input:

1. **Basic Duty Amount** = Value × (Basic Duty Rate ÷ 100)
2. **Section 301 Amount** = Value × (Section 301 Rate ÷ 100)
3. **Other Fees Amount** = Value × (Other Rate ÷ 100)
4. **Total Duty** = Basic Duty + Section 301 + Other Fees
5. **MPF (Merchandise Processing Fee)** = Value × 0.003464 (min $29.66, max $575.16)
6. **HMF (Harbor Maintenance Fee)** = Value × 0.00125
7. **Total Other Fees** = MPF + HMF
8. **Total Payable** = Total Duty + Total Other Fees

## Usage

Run the program with:

```bash
python customs_calculator.py --input-pdf ./CBP_Form_7501.pdf --json-data ./simplified_input_example.json
```

The program will:
1. Load your simplified input
2. Calculate all required values
3. Fill in constant values for other form fields
4. Generate a completed CBP Form 7501 PDF
5. Display a summary of the calculations

## Constants

All other form fields (importer information, transportation details, etc.) are filled with constant values. If you need to customize these fields, you can modify the `calculate_duties_and_fees` function in the `customs_calculator.py` file.
