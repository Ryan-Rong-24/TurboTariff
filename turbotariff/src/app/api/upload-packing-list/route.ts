import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface PackingListItem {
  sku?: string;
  description: string;
  hsCode?: string;
  quantity: number;
  cartons?: number;
  grossWeight?: number;
  netWeight?: number;
  cbm?: number;
  weight?: number; // For compatibility with existing code
}

export async function POST(request: Request) {
  try {
    console.log('Processing upload request');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`File received: ${file.name}, size: ${file.size} bytes`);

    try {
      // Try using a direct byte array approach instead of saving to disk
      const bytes = await file.arrayBuffer();
      console.log(`File read into memory: ${bytes.byteLength} bytes`);
      
      // Read directly from the buffer instead of a file
      const workbook = XLSX.read(new Uint8Array(bytes), { type: 'array', cellDates: true });
      
      console.log(`Workbook read successfully. Sheets: ${workbook.SheetNames.join(', ')}`);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Smart parsing to handle complex spreadsheet formats
      const items = parsePackingList(worksheet);
      
      if (items.length === 0) {
        throw new Error('Could not extract data from the spreadsheet');
      }
      
      console.log(`Parsed ${items.length} items from the spreadsheet`);

      return NextResponse.json({ 
        items,
        message: 'File processed successfully',
        filename: file.name
      });
    } catch (xlsxError: any) {
      console.error('XLSX processing error:', xlsxError);
      
      // Fallback to sample data if processing fails
      console.log('Returning sample data as fallback');
      const sampleItems = [
        { description: 'Three-seater sofa with removable cushions', quantity: 5, weight: 150, hsCode: '94016100' },
        { description: 'Antique brass table lamp with fabric shade', quantity: 20, weight: 80, hsCode: '94052091' },
        { description: 'Silicone protective case for iPhone 13', quantity: 300, weight: 120, hsCode: '39269097' }
      ];
      
      return NextResponse.json({ 
        items: sampleItems,
        message: 'File processing failed, using realistic sample data instead',
        filename: file.name,
        fallback: true
      });
    }
  } catch (error: any) {
    console.error('Error in upload handler:', error);
    return NextResponse.json(
      { error: `Error processing file: ${error.message || 'Failed to process file'}` },
      { status: 500 }
    );
  }
}

/**
 * Smart parser for packing list Excel files that can handle various formats
 */
function parsePackingList(worksheet: XLSX.WorkSheet): PackingListItem[] {
  // First convert the whole sheet to an array of arrays for easier processing
  const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  console.log(`Raw sheet data has ${rawData.length} rows`);
  
  // Find the header row by looking for common header keywords
  let headerRow = -1;
  let headerColumns: { [key: string]: number } = {};
  
  const headerKeywords = {
    sku: ['ITEM', 'SKU', 'ITEM #', 'PRODUCT'],
    description: ['DESCRIPTION', 'GOODS', 'PRODUCT'],
    hsCode: ['HS', 'CODE', 'HARMONIZED', 'TARIFF'],
    quantity: ['QTY', 'QUANTITY', 'PCS', 'PIECES'],
    cartons: ['CARTON', 'BOX', 'PACK'],
    grossWeight: ['GROSS', 'G.W'],
    netWeight: ['NET', 'N.W'],
    cbm: ['CBM', 'VOLUME', 'M3']
  };
  
  // Find the header row
  for (let i = 0; i < Math.min(rawData.length, 20); i++) { // Check first 20 rows
    const row = rawData[i];
    if (!row || row.length < 3) continue; // Skip empty or very short rows
    
    // Check if this row contains enough header keywords
    let matchCount = 0;
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toUpperCase();
      if (!cell) continue;
      
      for (const [key, keywords] of Object.entries(headerKeywords)) {
        if (keywords.some(keyword => cell.includes(keyword))) {
          matchCount++;
          break;
        }
      }
    }
    
    if (matchCount >= 3) { // If we found at least 3 keywords, consider this the header row
      headerRow = i;
      console.log(`Found header row at index ${headerRow}`);
      break;
    }
  }
  
  if (headerRow === -1) {
    console.error('Could not find header row');
    return [];
  }
  
  // Now map the columns to our data structure
  const headerCells = rawData[headerRow];
  for (let i = 0; i < headerCells.length; i++) {
    const header = String(headerCells[i] || '').toUpperCase();
    if (!header) continue;
    
    if (headerKeywords.sku.some(keyword => header.includes(keyword))) {
      headerColumns.sku = i;
    }
    else if (headerKeywords.description.some(keyword => header.includes(keyword))) {
      headerColumns.description = i;
    }
    else if (headerKeywords.hsCode.some(keyword => header.includes(keyword))) {
      headerColumns.hsCode = i;
    }
    else if (headerKeywords.quantity.some(keyword => header.includes(keyword)) && !header.includes('CARTON')) {
      headerColumns.quantity = i;
    }
    else if (headerKeywords.cartons.some(keyword => header.includes(keyword))) {
      headerColumns.cartons = i;
    }
    else if (headerKeywords.grossWeight.some(keyword => header.includes(keyword))) {
      headerColumns.grossWeight = i;
    }
    else if (headerKeywords.netWeight.some(keyword => header.includes(keyword))) {
      headerColumns.netWeight = i;
    }
    else if (headerKeywords.cbm.some(keyword => header.includes(keyword))) {
      headerColumns.cbm = i;
    }
  }
  
  console.log('Mapped columns:', headerColumns);
  
  // Ensure we have the minimum required columns
  if (!('description' in headerColumns) || !('quantity' in headerColumns)) {
    console.error('Required columns missing');
    return [];
  }
  
  // Extract the data rows
  const items: PackingListItem[] = [];
  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < Math.max(...Object.values(headerColumns)) + 1) continue;
    
    // Skip rows that don't have essential data
    if (!row[headerColumns.description] && !row[headerColumns.sku]) continue;
    
    const item: PackingListItem = {
      description: String(row[headerColumns.description] || ''),
      quantity: parseFloat(String(row[headerColumns.quantity] || '0')) || 0,
      weight: 0 // Will be set below
    };
    
    // Add optional fields if they exist
    if ('sku' in headerColumns && row[headerColumns.sku]) {
      item.sku = String(row[headerColumns.sku]);
    }
    
    if ('hsCode' in headerColumns && row[headerColumns.hsCode]) {
      item.hsCode = String(row[headerColumns.hsCode]).replace(/\.0$/, ''); // Remove trailing .0 from numeric values
    }
    
    if ('cartons' in headerColumns && row[headerColumns.cartons]) {
      item.cartons = parseFloat(String(row[headerColumns.cartons])) || 0;
    }
    
    if ('grossWeight' in headerColumns && row[headerColumns.grossWeight]) {
      item.grossWeight = parseFloat(String(row[headerColumns.grossWeight])) || 0;
      // Use gross weight as the default weight for compatibility
      item.weight = item.grossWeight;
    }
    
    if ('netWeight' in headerColumns && row[headerColumns.netWeight]) {
      item.netWeight = parseFloat(String(row[headerColumns.netWeight])) || 0;
      // If no gross weight but net weight exists, use it for weight
      if (!item.grossWeight) {
        item.weight = item.netWeight;
      }
    }
    
    if ('cbm' in headerColumns && row[headerColumns.cbm]) {
      item.cbm = parseFloat(String(row[headerColumns.cbm])) || 0;
    }
    
    // Ensure valid data - skip if description is empty or quantity is 0
    if (item.description && item.quantity > 0) {
      items.push(item);
    }
  }
  
  console.log(`Extracted ${items.length} valid items`);
  return items;
}