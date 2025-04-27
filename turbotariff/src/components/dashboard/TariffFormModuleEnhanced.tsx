'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { SmartSuggestions } from './SmartSuggestions';
import { ProgressTracker } from './ProgressTracker';
import { InsightsPanel } from './InsightsPanel';
import { TariffCalculator } from './TariffCalculator';
import {
  uploadPackingList,
  getSmartSuggestions,
  calculateTariffs,
  generateTariffForm,
} from '@/lib/api';
import { useStore } from '@/lib/store';
import { usePdfGenerator } from '@/lib/hooks/usePdfGenerator';

interface Item {
  id?: string;
  description: string;
  quantity: number;
  weight: number;
  imageUrl?: string;
  hsCode?: string;
  suggestions?: any;
  sku?: string;
  cartons?: number;
  grossWeight?: number;
  netWeight?: number;
  cbm?: number;
  // Additional fields for tariff information
  value?: string | number;
  basic_duty_rate?: string | number;
  section_301_rate?: string | number;
  other_rate?: string | number;
}

interface FormItemData {
  id: string;
  hts_number: string;
  country_of_origin: string;
  description: string;
  value: string;
  basic_duty_rate: string;
  section_301_rate: string;
  other_rate: string;
}

type ProgressStepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

interface ProgressStep {
  id: string;
  title: string;
  status: ProgressStepStatus;
}

export function TariffFormModuleEnhanced() {
  const addFormToHistory = useStore((state) => state.addFormToHistory);
  const [items, setItems] = useState<Item[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'tariff' | 'preview' | 'processing' | 'results'>('upload');
  const [activeMode, setActiveMode] = useState<'upload' | 'manual'>('upload');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    {
      id: '1',
      title: 'Analyzing Items',
      status: 'pending',
    },
    {
      id: '2',
      title: 'Fetching Tariff Rates',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Calculating Duties',
      status: 'pending',
    },
    {
      id: '4',
      title: 'Generating Forms',
      status: 'pending',
    },
  ]);
  const [localPdfs, setLocalPdfs] = useState<Array<{ url: string, itemId: string }>>([]);
  const { generating, generatedPdfs, generatePdf } = usePdfGenerator();

  // Sync with PDFs from the hook
  React.useEffect(() => {
    if (generatedPdfs.length > 0) {
      setLocalPdfs(generatedPdfs);
    }
  }, [generatedPdfs]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    onDrop: async (acceptedFiles) => {
      try {
        // If there are unsaved changes, prompt user before proceeding
        if (hasUnsavedChanges && items.length > 0) {
          if (!confirm("You have unsaved changes. Uploading a new file will discard these changes. Continue?")) {
            return;
          }
        }
        
        const file = acceptedFiles[0];
        console.log('Dropzone file:', file);
        const response = await uploadPackingList(file);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        console.log('Upload response data:', response.data);
        
        // Check if items exist in the response
        if (!response.data.items || !Array.isArray(response.data.items)) {
          console.error('Invalid response format:', response.data);
          throw new Error('Invalid response format from server');
        }

        // Ensure items have unique IDs
        const itemsWithIds = response.data.items.map((item: Item, index: number) => ({
          ...item,
          id: item.id || `item-${index + 1}`
        }));

        setItems(itemsWithIds);
        setActiveMode('upload');
        
        // Move directly to tariff calculation for the first item
        setCurrentItemIndex(0);
        setCurrentStep('tariff');
        
        setHasUnsavedChanges(false);
        toast.success(`File ${response.data.filename || 'unknown'} uploaded successfully`);
      } catch (error: any) {
        console.error('Dropzone error:', error);
        toast.error(error.message || 'Failed to process file');
      }
    },
  });

  const addItem = () => {
    // If there are unsaved changes from a file upload, prompt user
    if (hasUnsavedChanges && items.length > 0 && activeMode === 'upload') {
      if (!confirm("You have an uploaded file with unsaved changes. Creating a manual list will discard these changes. Continue?")) {
        return;
      }
    }
    
    const newItem: Item = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 0,
      weight: 0,
      sku: '',
      hsCode: ''
    };
    
    // Clear existing items if switching from upload mode to manual mode
    if (activeMode === 'upload') {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
    
    setActiveMode('manual');
    setCurrentItemIndex(items.length);
    setCurrentStep('tariff');
    setHasUnsavedChanges(true);
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setHasUnsavedChanges(true);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      // TODO: Implement image upload to a storage service
      const imageUrl = URL.createObjectURL(file);
      updateItem(index, 'imageUrl', imageUrl);
      toast.success('Image uploaded successfully');
      setHasUnsavedChanges(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    }
  };

  const handleTariffCalculationComplete = (itemData: FormItemData) => {
    // Update the current item with tariff data
    if (currentItemIndex >= 0 && currentItemIndex < items.length) {
      const updatedItems = [...items];
      updatedItems[currentItemIndex] = {
        ...updatedItems[currentItemIndex],
        hsCode: itemData.hts_number,
        description: itemData.description,
        value: itemData.value,
        basic_duty_rate: itemData.basic_duty_rate,
        section_301_rate: itemData.section_301_rate,
        other_rate: itemData.other_rate
      };
      setItems(updatedItems);
      
      // Move to the next item if available, otherwise go to preview
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      } else {
        setCurrentStep('preview');
      }
    } else {
      console.error('Invalid item index:', currentItemIndex);
      setCurrentStep('preview');
    }
  };

  const handleSubmit = async () => {
    setCurrentStep('processing');
    setHasUnsavedChanges(false); // Mark as saved when submitting
    setLocalPdfs([]); // Clear any previous PDFs
    
    // Reset progress steps
    setProgressSteps((prevSteps) => 
      prevSteps.map(step => ({ ...step, status: 'pending' }))
    );
    
    const updateProgress = (stepId: string, status: ProgressStepStatus) => {
      setProgressSteps((steps) =>
        steps.map((step) =>
          step.id === stepId ? { ...step, status } : step
        )
      );
    };

    try {
      // Convert items to the format expected by the PDF writer
      const formattedItems = items.map((item) => ({
        id: item.id || `item-${Date.now()}`,
        hts_number: item.hsCode || "",
        country_of_origin: "CN", // Default to China
        description: item.description || "",
        value: typeof item.value === 'number' 
          ? item.value.toString() 
          : (item.value || (item.weight ? (item.weight * 10).toString() : "1000.00")), // Use calculated value or estimate
        basic_duty_rate: typeof item.basic_duty_rate === 'number'
          ? item.basic_duty_rate.toString()
          : (item.basic_duty_rate || "2.5"), // Use calculated rate or default
        section_301_rate: typeof item.section_301_rate === 'number'
          ? item.section_301_rate.toString()
          : (item.section_301_rate || "7.5"), // Use calculated rate or default
        other_rate: typeof item.other_rate === 'number'
          ? item.other_rate.toString()
          : (item.other_rate || "0"), // Use calculated rate or default
        gross_weight: item.weight ? item.weight.toString() : "10.00",
        manifest_qty: item.quantity ? item.quantity.toString() : "100",
        net_quantity: item.quantity ? item.quantity.toString() : "100"
      }));

      // Step 1 & 2: Analyze items & Calculate tariffs - already done in previous steps
      updateProgress('1', 'completed');
      updateProgress('2', 'completed');

      // Step 3: Generate form
      updateProgress('3', 'in-progress');
      
      // Call API to generate forms
      const formResponse = await fetch('http://localhost:5001/api/generate-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: formattedItems }),
      });
      
      if (!formResponse.ok) {
        const errorData = await formResponse.json();
        throw new Error(errorData.error || 'Failed to generate forms');
      }
      
      const formData = await formResponse.json();
      console.log('Form generation response:', formData);
      
      if (formData.pdf_files && formData.pdf_files.length > 0) {
        // Update PDFs list with generated files
        const pdfs = formData.pdf_files.map((pdf: any) => ({
          url: pdf.url,
          itemId: formattedItems.find((item: any) => pdf.path.includes(item.id))?.id || 'default'
        }));
        
        setLocalPdfs(pdfs);
      } else {
        // Fallback: use generatePdf from usePdfGenerator hook
        const pdfs = await generatePdf();
        if (pdfs && pdfs.length > 0) {
          setLocalPdfs(pdfs);
        }
      }
      
      updateProgress('3', 'completed');

      // Step 4: Complete
      updateProgress('4', 'in-progress');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateProgress('4', 'completed');
      
      // Save to form history
      formattedItems.forEach((item, index) => {
        addFormToHistory({
          description: item.description || "Tariff Form",
          hsCode: item.hts_number || "",
          value: parseFloat(item.value || "0"),
          dutyAmount: parseFloat(item.basic_duty_rate || "0") + parseFloat(item.section_301_rate || "0") + parseFloat(item.other_rate || "0"),
          status: 'completed',
          pdfUrl: localPdfs[index]?.url || '/output/completed_form.pdf'
        });
      });
      
      setCurrentStep('results');
    } catch (error: any) {
      console.error('Error generating forms:', error);
      toast.error(error.message || 'Failed to process tariff form');
      setCurrentStep('preview');
    }
  };

  // Safe method to check if file exists before trying to open it
  const openPdf = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Tariff Form Generation</h2>

      {currentStep === 'upload' && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">Drag and drop your packing list spreadsheet here, or click to select</p>
          </div>
          <div className="text-center">
            <button
              onClick={addItem}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Manual List
            </button>
          </div>
        </div>
      )}

      {currentStep === 'tariff' && currentItemIndex >= 0 && currentItemIndex < items.length && (
        <div>
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {`Calculating tariffs for item ${currentItemIndex + 1} of ${items.length}`}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Please provide a detailed description of your product to find the correct HS code.</p>
                </div>
              </div>
            </div>
          </div>
          
          <TariffCalculator 
            onComplete={handleTariffCalculationComplete}
            initialDescription={items[currentItemIndex].description}
            initialValue={(items[currentItemIndex].value?.toString()) || "1000"}
          />
        </div>
      )}

      {currentStep === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Items List</h3>
              <button 
                onClick={addItem}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HS Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duty Rates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.hsCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${item.value?.toString() || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          Basic: {item.basic_duty_rate || "0"}%<br />
                          Section 301: {item.section_301_rate || "0"}%<br />
                          Other: {item.other_rate || "0"}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setCurrentItemIndex(index);
                            setCurrentStep('tariff');
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setItems(items.filter((_, i) => i !== index));
                            setHasUnsavedChanges(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-4 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (!confirm("You have unsaved changes. Going back will discard these changes. Continue?")) {
                      return;
                    }
                  }
                  setCurrentStep('upload');
                  setHasUnsavedChanges(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={items.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Tariff Forms
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'processing' && (
        <div className="space-y-6">
          <ProgressTracker steps={progressSteps} />
        </div>
      )}

      {currentStep === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-green-800">Tariff Forms Generated Successfully</h3>
              <p className="mt-2 text-sm text-green-700">
                {localPdfs.length > 1 
                  ? `${localPdfs.length} tariff forms have been generated and are ready for download.`
                  : "Your tariff form has been generated and is ready for download."}
              </p>
            </div>
            <div className="mt-4 border border-gray-200 rounded-md p-4 bg-white">
              <h4 className="text-md font-medium text-gray-700">Download Files</h4>
              
              {localPdfs.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {/* If multiple PDFs, show a list */}
                  {localPdfs.length > 1 ? (
                    <div className="space-y-2">
                      {localPdfs.map((pdf, index) => {
                        const item = items.find(i => i.id === pdf.itemId);
                        return (
                          <div key={pdf.itemId || index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1 truncate">
                              <span className="font-medium">{item?.description || `Item ${index + 1}`}</span>
                              {item?.hsCode && <span className="ml-2 text-sm text-gray-500">HS: {item.hsCode}</span>}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openPdf(pdf.url)}
                                className="text-blue-600 hover:text-blue-800 px-2 py-1"
                                title="View PDF"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <a
                                href={pdf.url}
                                download={`CBP_Form_7501_${item?.hsCode?.replace(/\./g, '') || 'item'}_${index + 1}.pdf`}
                                className="text-red-600 hover:text-red-800 px-2 py-1"
                                title="Download PDF"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Show buttons for single PDF
                    <>
                      <a 
                        href={localPdfs[0].url} 
                        download="CBP_Form_7501.pdf"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        Download CBP Form 7501 (PDF)
                      </a>
                      <button 
                        onClick={() => openPdf(localPdfs[0].url)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View PDF in Browser
                      </button>
                    </>
                  )}
                </div>
              ) : (
                // Try to use fallback when no PDFs are available
                <div className="mt-3 space-y-3">
                  <p className="text-amber-600 mb-2">Attempting to locate PDF files for your items...</p>
                  
                  <button
                    onClick={() => {
                      // Try to regenerate PDFs
                      generatePdf().then(pdfs => {
                        if (pdfs && pdfs.length > 0) {
                          setLocalPdfs(pdfs);
                          toast.success(`Found ${pdfs.length} PDFs`);
                        } else {
                          // Try fallback to completed_form.pdf
                          openPdf('/output/completed_form.pdf');
                        }
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry PDF Generation
                  </button>
                  
                  <button
                    onClick={() => openPdf('/output/completed_form.pdf')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Try View Default Form
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setCurrentStep('upload');
                  setHasUnsavedChanges(false);
                  setItems([]);
                  setLocalPdfs([]);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create New Form
              </button>
            </div>
          </div>
          <div>
            {/* Display a summary of the tariff calculations */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tariff Summary</h3>
              
              <div className="overflow-hidden border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HS Code</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rate</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => {
                      const value = parseFloat(item.value?.toString() || "0");
                      const basicRate = parseFloat(item.basic_duty_rate?.toString() || "0");
                      const section301Rate = parseFloat(item.section_301_rate?.toString() || "0");
                      const otherRate = parseFloat(item.other_rate?.toString() || "0");
                      const totalRate = basicRate + section301Rate + otherRate;
                      const dutyAmount = (value * totalRate) / 100;
                      
                      return (
                        <tr key={item.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hsCode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${value.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{totalRate.toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dutyAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">Total:</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        $
                        {items.reduce((total, item) => {
                          const value = parseFloat(item.value?.toString() || "0");
                          const basicRate = parseFloat(item.basic_duty_rate?.toString() || "0");
                          const section301Rate = parseFloat(item.section_301_rate?.toString() || "0");
                          const otherRate = parseFloat(item.other_rate?.toString() || "0");
                          const totalRate = basicRate + section301Rate + otherRate;
                          const dutyAmount = (value * totalRate) / 100;
                          return total + dutyAmount;
                        }, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}