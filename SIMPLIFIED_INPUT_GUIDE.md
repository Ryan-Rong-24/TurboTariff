# Simplified Input Guide for Customs Calculator

This guide explains the simplified input format for the TurboTariff customs calculator program.

## Input Variables

The simplified input JSON file requires the following variables to calculate customs duties and fees and properly fill out CBP Form 7501:

| Field | Description | Example | Format | Required |
|-------|-------------|---------|--------|----------|
| `hts_number` | Harmonized Tariff Schedule classification code | `"3304.10.0000"` | String | Yes |
| `description` | Description of the goods | `"Lip make-up preparations (Lipstick)"` | String | Yes |
| `value` | Entered value in USD | `"10000.00"` | String, numeric with 2 decimal places | Yes |
| `basic_duty_rate` | Basic duty rate percentage | `"0"` | String, percentage without % symbol | Yes |
| `section_301_rate` | Section 301 tariff rate percentage | `"7.5"` | String, percentage without % symbol | Yes |
| `other_rate` | Other fees rate percentage | `"145"` | String, percentage without % symbol | Yes |
| `gross_weight` | Gross weight of shipment in kilograms | `"25.50"` | String, numeric with 2 decimal places | Optional (default: "10.00") |
| `manifest_qty` | Manifest quantity | `"200"` | String, numeric | Optional (default: "100") |
| `net_quantity` | Net quantity of goods | `"180"` | String, numeric | Optional (default: "100") |
| `htsus_units` | HTSUS units of measure | `"PCS"` | String (e.g., PCS, KG, DOZ) | Optional (default: "PCS") |

## Example Input File

```json
{
  "hts_number": "3304.10.0000",
  "description": "Lip make-up preparations (Lipstick)",
  "value": "10000.00",
  "basic_duty_rate": "0",
  "section_301_rate": "7.5",
  "other_rate": "145",
  "gross_weight": "25.50",
  "manifest_qty": "200",
  "net_quantity": "180",
  "htsus_units": "PCS"
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

## Form Field Mapping

The program maps your input data to specific fields on CBP Form 7501:

| Input Field | Form Field/Section | Description |
|-------------|-------------------|-------------|
| `hts_number` | Column 28A | HTSUS classification code |
| `description` | Column 28 | Description of merchandise |
| `value` | Column 31A | Entered value |
| `gross_weight` | Column 29A | Gross weight in kilograms |
| `manifest_qty` | Column 28 | Manifest quantity |
| `net_quantity` + `htsus_units` | Column 28 | Net quantity with units of measure |

## Usage

Run the program with:

```bash
python code/pdf_writer/pdf_writer.py --input-pdf ./CBP_Form_7501.pdf --json-data ./code/pdf_writer/simplified_input_example.json --output-pdf ./output/completed_form.pdf
```

The program will:
1. Load your simplified input
2. Calculate all required values
3. Fill in constant values for other form fields
4. Generate a completed CBP Form 7501 PDF
5. Display a summary of the calculations

## Constants and Default Values

The following form fields are automatically filled with constant values:

1. **Entry Information**: Filer code, entry type, port code, dates
2. **Bond Information**: Bond type, surety number
3. **Transportation Information**: Mode, carrier, bill of lading, manifest ID, ports
4. **Importer/Consignee Information**: Importer number, address details
5. **Declaration**: Declarant name, title, broker information
6. **Country of Origin**: Default is "CN" (China)
7. **Relationship Code**: Default is "N" (No relationship)

If you need to customize these constant fields, you can modify the `calculate_duties_and_fees` function in the `pdf_writer.py` file.

## Output

The completed PDF form will be saved to the specified output path. The program will also display a summary of the calculations in the terminal, including:

- Input values used for calculations
- All calculated duty and fee amounts
- Total payable amount
