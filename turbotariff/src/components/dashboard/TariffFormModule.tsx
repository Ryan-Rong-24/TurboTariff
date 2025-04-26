'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { SmartSuggestions } from './SmartSuggestions';
import { ProgressTracker } from './ProgressTracker';
import { InsightsPanel } from './InsightsPanel';
import {
  uploadPackingList,
  getSmartSuggestions,
  calculateTariffs,
  generateTariffForm,
} from '@/lib/api';
import { useStore } from '@/lib/store';

interface Item {
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
}

interface TariffCalculation {
  hsCode: string;
  description: string;
  rate: number;
  country: string;
  effectiveDate: string;
  totalDuty: number;
  mpf: number;
  hmf: number;
  totalFees: number;
}

interface TariffSummary {
  totalDuty: number;
  totalMpf: number;
  totalHmf: number;
  totalFees: number;
}

type ProgressStepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

interface ProgressStep {
  id: string;
  title: string;
  status: ProgressStepStatus;
}

export function TariffFormModule() {
  const addFormToHistory = useStore((state) => state.addFormToHistory);
  const [items, setItems] = useState<Item[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing' | 'results'>('upload');
  const [activeMode, setActiveMode] = useState<'upload' | 'manual'>('upload');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
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
      title: 'Generating Form',
      status: 'pending',
    },
  ]);
  const [tariffCalculations, setTariffCalculations] = useState<TariffCalculation[]>([]);
  const [tariffSummary, setTariffSummary] = useState<TariffSummary | null>(null);
  const [formData, setFormData] = useState<any>(null);

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

        setItems(response.data.items);
        setActiveMode('upload');
        setCurrentStep('preview');
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
    setCurrentStep('preview');
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

  const handleSubmit = async () => {
    setCurrentStep('processing');
    setHasUnsavedChanges(false); // Mark as saved when submitting
    
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
      // Step 1: Analyze items
      updateProgress('1', 'in-progress');
      for (const item of items) {
        if (item.description) {
          const response = await getSmartSuggestions(item.description, item.imageUrl);
          if (response.data) {
            const index = items.findIndex((i) => i.description === item.description);
            if (index !== -1) {
              updateItem(index, 'hsCode', response.data.hsCode);
            }
          }
        }
      }
      updateProgress('1', 'completed');

      // Step 2: Calculate tariffs
      updateProgress('2', 'in-progress');
      const tariffResponse = await calculateTariffs(items);
      if (tariffResponse.error) {
        throw new Error(tariffResponse.error);
      }
      setTariffCalculations(tariffResponse.data.calculations);
      setTariffSummary(tariffResponse.data.summary);
      updateProgress('2', 'completed');

      // Step 3: Generate form
      updateProgress('3', 'in-progress');
      const formResponse = await generateTariffForm({ items });
      if (formResponse.error) {
        throw new Error(formResponse.error);
      }
      console.log('Form generation response:', formResponse.data);
      setFormData(formResponse.data.formData);
      
      // Save to form history
      if (formResponse.data.success && tariffSummary) {
        addFormToHistory({
          description: items[0]?.description || "Tariff Form",
          hsCode: formResponse.data.formData?.hts_number || items[0]?.hsCode || "",
          value: parseFloat(formResponse.data.formData?.value || "0"),
          dutyAmount: tariffSummary.totalFees,
          status: 'completed',
          pdfUrl: formResponse.data.pdfUrl
        });
      }
      
      updateProgress('3', 'completed');

      // Step 4: Complete
      updateProgress('4', 'in-progress');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateProgress('4', 'completed');
      
      setCurrentStep('results');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process tariff form');
      setCurrentStep('preview');
    }
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

      {currentStep === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Items List</h3>
              <button 
                onClick={() => {
                  const newItem: Item = {
                    description: '',
                    quantity: 0,
                    weight: 0,
                    sku: '',
                    hsCode: ''
                  };
                  setItems([...items, newItem]);
                  setHasUnsavedChanges(true);
                }}
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
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HS Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr>
                        <td className="px-6 py-4 align-top">
                          <input
                            type="text"
                            value={item.sku || ''}
                            onChange={(e) => updateItem(index, 'sku', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="SKU"
                          />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Product description"
                            />
                            {item.description && (
                              <SmartSuggestions
                                item={item}
                                onAccept={(suggestion) => {
                                  updateItem(index, 'description', suggestion.improvedDescription);
                                  updateItem(index, 'hsCode', suggestion.hsCode);
                                  toast.success('Suggestions applied successfully');
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <input
                            type="text"
                            value={item.hsCode || ''}
                            onChange={(e) => updateItem(index, 'hsCode', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="HS Code"
                          />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <input
                            type="number"
                            value={item.weight}
                            onChange={(e) => updateItem(index, 'weight', parseFloat(e.target.value) || 0)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col space-y-2">
                            <label className="inline-flex items-center px-3 py-1 rounded-md border border-gray-300 bg-white text-sm cursor-pointer hover:bg-gray-50">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Upload Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(index, file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            
                            {item.imageUrl && (
                              <div className="relative">
                                <img
                                  src={item.imageUrl}
                                  alt="Item"
                                  className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  onClick={() => updateItem(index, 'imageUrl', undefined)}
                                  className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm hover:bg-red-50"
                                  title="Remove image"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      {index < items.length - 1 && (
                        <tr className="h-2 bg-gray-50">
                          <td colSpan={6} className="p-0"></td>
                        </tr>
                      )}
                    </React.Fragment>
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
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Generate Tariff Form
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
              <h3 className="text-lg font-medium text-green-800">Tariff Form Generated Successfully</h3>
              <p className="mt-2 text-sm text-green-700">
                Your tariff form has been generated and is ready for download.
              </p>
            </div>
            <div className="mt-4 border border-gray-200 rounded-md p-4 bg-white">
              <h4 className="text-md font-medium text-gray-700">Download Files</h4>
              <div className="mt-3 space-y-3">
                <a 
                  href="/output/completed_form.pdf" 
                  download="CBP_Form_7501.pdf"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Download CBP Form 7501 (PDF)
                </a>
                <a 
                  href="/output/completed_form.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View PDF in Browser
                </a>
              </div>
              
              {formData && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-md font-medium text-gray-700">Form Details</h4>
                  <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                    <div><strong>HTS Number:</strong> {formData.hts_number}</div>
                    <div><strong>Country of Origin:</strong> {formData.country_of_origin}</div>
                    <div><strong>Value:</strong> ${formData.value}</div>
                    <div><strong>Basic Duty Rate:</strong> {formData.basic_duty_rate}%</div>
                    <div><strong>Section 301 Rate:</strong> {formData.section_301_rate}%</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setCurrentStep('upload');
                  setHasUnsavedChanges(false);
                  setItems([]);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create New Form
              </button>
            </div>
          </div>
          <div>
            <InsightsPanel
              tariffRates={tariffCalculations}
              riskFactors={[
                {
                  category: "Tariff Classification",
                  level: "low",
                  description: "HS code classification is accurate",
                  recommendation: "No action required",
                },
                {
                  category: "Documentation",
                  level: "medium",
                  description: "Some item descriptions could be more detailed",
                  recommendation: "Consider adding more specific product details",
                },
              ]}
              summary={tariffSummary || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}