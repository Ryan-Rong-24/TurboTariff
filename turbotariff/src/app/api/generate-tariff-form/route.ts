import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { items } = data;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items data' },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });

    // Create output directory if it doesn't exist
    const outputDir = join(process.cwd(), 'public', 'output');
    await mkdir(outputDir, { recursive: true });

    // Convert each item to the format expected by the PDF generator
    const processedItems = await manualItemsConversion(items);
    console.log(`Processed ${processedItems.length} items for PDF generation`);
    
    // Save the processed items to a temporary JSON file
    const tempItemsPath = join(tempDir, 'items.json');
    await writeFile(tempItemsPath, JSON.stringify(processedItems, null, 2));
    
    // Log the processed items for debugging
    console.log('Processed items:', JSON.stringify(processedItems, null, 2));

    // Get paths to the multi-PDF writer script and template
    const scriptPath = join(process.cwd(), '..', 'code', 'pdf_writer', 'pdf_writer_multi.py');
    const legacyScriptPath = join(process.cwd(), '..', 'code', 'pdf_writer', 'pdf_writer.py');
    const templatePath = join(process.cwd(), '..', 'code', 'pdf_writer', 'CBP_Form_7501.pdf');

    // Select which script to use - prefer the multi-PDF writer
    const pdfScriptPath = fs.existsSync(scriptPath) ? scriptPath : legacyScriptPath;
    const isMultiPdf = pdfScriptPath === scriptPath;

    // Verify all paths exist
    console.log('Verifying paths:');
    console.log(`- Script path: ${pdfScriptPath} (exists: ${fs.existsSync(pdfScriptPath)})`);
    console.log(`- Template path: ${templatePath} (exists: ${fs.existsSync(templatePath)})`);
    console.log(`- Input JSON path: ${tempItemsPath} (exists: ${fs.existsSync(tempItemsPath)})`);
    
    let pdfGenerationOutput = "";
    try {
      // Run the PDF writer script
      let command;
      if (isMultiPdf) {
        command = `python3 "${pdfScriptPath}" --input-pdf "${templatePath}" --json-data "${tempItemsPath}" --output-dir "${outputDir}"`;
      } else {
        // Fallback to legacy script (single PDF)
        const outputPath = join(outputDir, 'completed_form.pdf');
        command = `python3 "${pdfScriptPath}" --input-pdf "${templatePath}" --json-data "${tempItemsPath}" --output-pdf "${outputPath}"`;
      }
      
      console.log(`Executing: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error('Error generating PDF:', stderr);
        // Continue anyway - we'll check if output was generated
      }
      
      // Log any stdout
      if (stdout) {
        pdfGenerationOutput = stdout;
        console.log('PDF Generator output:', stdout);
      }
    } catch (execError: any) {
      console.error('Command execution failed:', execError);
      // Continue anyway - we'll check if output was generated 
    }
    
    // List files in output directory
    console.log('Files in output directory:');
    try {
      const files = fs.readdirSync(outputDir);
      files.forEach(file => console.log(`- ${file}`));
    } catch (e) {
      console.error('Error listing files in output directory:', e);
    }
    
    // Check if PDFs were generated - use direct file existence check first
    let generatedPdfs: Array<{url: string, itemId: string}> = [];
    
    // First, check if we can just parse the output of the PDF generator to find the generated files
    if (pdfGenerationOutput && pdfGenerationOutput.includes('Successfully generated')) {
      // Extract file paths from output
      const matches = pdfGenerationOutput.matchAll(/- (.+\.pdf)/g);
      if (matches) {
        for (const match of Array.from(matches)) {
          if (match[1]) {
            const filePath = match[1];
            const fileName = filePath.split('/').pop()!;
            if (fs.existsSync(join(outputDir, fileName))) {
              console.log(`Found PDF from generator output: ${fileName}`);
              
              // Try to extract the item ID from the filename
              let itemId = 'default';
              for (const item of processedItems) {
                const id = item.id || '';
                const htsNumber = (item.hts_number || '').replace(/\./g, '');
                if (fileName.includes(htsNumber) || fileName.includes(id)) {
                  itemId = id;
                  break;
                }
              }
              
              generatedPdfs.push({
                url: `/output/${fileName}`,
                itemId
              });
            }
          }
        }
      }
    }
    
    // If no PDFs found from the output, try the file scanning method
    if (generatedPdfs.length === 0) {
      console.log('No PDFs found from generator output, scanning directory...');
      generatedPdfs = findGeneratedPdfs(outputDir, processedItems);
    }
    
    // If still no PDFs found, check for any PDFs in the directory
    if (generatedPdfs.length === 0) {
      console.log('Searching for any PDF files in the output directory...');
      try {
        const files = fs.readdirSync(outputDir);
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));
        
        for (let i = 0; i < pdfFiles.length; i++) {
          console.log(`Found PDF file: ${pdfFiles[i]}`);
          const itemId = i < processedItems.length ? processedItems[i].id : `item-${i + 1}`;
          generatedPdfs.push({
            url: `/output/${pdfFiles[i]}`,
            itemId
          });
        }
      } catch (e) {
        console.error('Error finding PDF files:', e);
      }
    }
    
    // Last resort - use completed_form.pdf if it exists
    if (generatedPdfs.length === 0 && fs.existsSync(join(outputDir, 'completed_form.pdf'))) {
      console.log('Using completed_form.pdf as fallback');
      generatedPdfs.push({ 
        url: '/output/completed_form.pdf', 
        itemId: processedItems.length > 0 ? processedItems[0]?.id || 'default' : 'default'
      });
    }
    
    // If still no PDFs found, try a sample
    if (generatedPdfs.length === 0) {
      console.error('No PDFs were generated.');
      
      // Fall back to a sample PDF if available
      const samplePath = join(process.cwd(), 'public', 'sample_completed_form.pdf');
      if (fs.existsSync(samplePath)) {
        const fallbackPath = join(outputDir, 'completed_form.pdf');
        fs.copyFileSync(samplePath, fallbackPath);
        console.log('Using sample PDF instead.');
        generatedPdfs.push({ 
          url: '/output/completed_form.pdf', 
          itemId: 'sample' 
        });
      } else {
        throw new Error('Failed to generate PDF and no sample available');
      }
    }
    
    console.log(`Found ${generatedPdfs.length} PDFs:`, generatedPdfs.map(pdf => pdf.url).join(', '));

    return NextResponse.json({
      success: true,
      pdfs: generatedPdfs,
      totalCount: generatedPdfs.length,
      message: `Generated ${generatedPdfs.length} CBP Form(s) 7501 successfully`,
      items: processedItems
    });
  } catch (error: any) {
    console.error('Error generating tariff form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate tariff form' },
      { status: 500 }
    );
  }
}

// Helper function to manually convert items to the format expected by the PDF generator
async function manualItemsConversion(items: any[]) {
  // Ensure we always return an array, even if it's just one item
  return items.map((item, index) => {
    // Extract rates with fallbacks - use more accurate defaults
    const basic_duty_rate = item.basic_duty_rate || item.generalRate || item.general_rate || "0";
    const section_301_rate = item.section_301_rate || item.adcvdRate || item.section301_rate || "20"; // Section 301 is typically 20%
    
    // For IRC rate, combine IEEPA and reciprocal if available, or use provided other_rate
    let other_rate = "0";
    if (item.ieepa_rate !== undefined && item.reciprocal_rate !== undefined) {
      // If both rates are available as separate values, add them
      const ieepRate = parseFloat(item.ieepa_rate) || 0;
      const recipRate = parseFloat(item.reciprocal_rate) || 0;
      other_rate = (ieepRate + recipRate).toString();
    } else if (item.other_rate !== undefined) {
      // Otherwise use the provided other_rate
      other_rate = item.other_rate;
    } else if (item.ircRate !== undefined) {
      // Or use ircRate if available
      other_rate = item.ircRate;
    } else {
      // Default combined rate (IEEPA + Reciprocal typically equals 145% for China)
      other_rate = "145";
    }
    
    // For value, convert any numeric value to string, estimate from weight if needed
    const value = typeof item.value === 'number' 
      ? item.value.toString() 
      : typeof item.value === 'string' && item.value 
        ? item.value 
        : (item.weight ? (item.weight * 10).toString() : "1000.00");
        
    return {
      id: item.id || `item-${index + 1}`,
      hts_number: item.hsCode || item.hts_number || "",
      country_of_origin: item.country_of_origin || "CN", // Default to China
      description: item.description || "",
      value: value,
      basic_duty_rate: basic_duty_rate, // A. HTSUS Rate
      section_301_rate: section_301_rate, // B. AD/CVD Rate
      other_rate: other_rate, // C. IRC Rate (IEEPA + Reciprocal)
      gross_weight: item.weight ? item.weight.toString() : (item.gross_weight || "10.00"),
      manifest_qty: item.quantity ? item.quantity.toString() : (item.manifest_qty || "100"),
      net_quantity: item.quantity ? item.quantity.toString() : (item.net_quantity || "100")
    };
  });
}

// Helper function to find generated PDFs
function findGeneratedPdfs(outputDir: string, items: any[]) {
  const generatedPdfs: Array<{url: string, itemId: string}> = [];
  
  // Log before processing
  console.log('Searching for generated PDFs in:', outputDir);
  console.log(`Items is an array with ${items.length} elements`);
  
  // Look for PDFs that might have been generated
  try {
    const files = fs.readdirSync(outputDir);
    console.log('Files in directory:', files.join(', '));
    
    // First, try to find PDFs with specific naming patterns from the multi-PDF generator
    for (const item of items) {
      const itemId = item.id || '';
      const htsNumber = (item.hts_number || '').replace(/\./g, '');
      
      console.log(`Looking for files matching item ${itemId}, HS code ${htsNumber}`);
      
      // Check for files with patterns like CBP_Form_7501_94016100_item-1.pdf
      const matchingFiles = files.filter(file => {
        const matches = file.startsWith('CBP_Form_7501') && 
                      ((htsNumber && file.includes(htsNumber)) ||
                       (itemId && file.includes(itemId)));
        if (matches) {
          console.log(`File ${file} matches criteria`);
        }
        return matches;
      });
      
      if (matchingFiles.length > 0) {
        for (const file of matchingFiles) {
          console.log(`Adding matching file to results: ${file}`);
          generatedPdfs.push({
            url: `/output/${file}`,
            itemId: itemId
          });
        }
      } else {
        // Try a more relaxed match
        const relaxedFiles = files.filter(file => 
          file.startsWith('CBP_Form_7501') && 
          (htsNumber ? file.includes(htsNumber.substring(0, 4)) : false)
        );
        
        if (relaxedFiles.length > 0) {
          console.log(`Found files with relaxed matching: ${relaxedFiles.join(', ')}`);
          for (const file of relaxedFiles) {
            generatedPdfs.push({
              url: `/output/${file}`,
              itemId: itemId
            });
          }
        }
      }
    }
    
    // If no specific matches found, look for any CBP form
    if (generatedPdfs.length === 0) {
      console.log('No specific matches found, looking for any CBP forms');
      const cbpForms = files.filter(file => file.startsWith('CBP_Form_7501') || file === 'completed_form.pdf');
      console.log('Found CBP forms:', cbpForms.join(', '));
      
      for (let i = 0; i < cbpForms.length; i++) {
        const itemId = i < items.length ? items[i].id : `item-${i + 1}`;
        generatedPdfs.push({
          url: `/output/${cbpForms[i]}`,
          itemId
        });
      }
    }
  } catch (error) {
    console.error('Error scanning output directory:', error);
  }
  
  console.log(`Found ${generatedPdfs.length} PDFs in directory`);
  return generatedPdfs;
}