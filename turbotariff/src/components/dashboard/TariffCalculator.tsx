'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HsCodeSearch } from './HsCodeSearch';

interface TariffSource {
  name: string;
  rate: number;
  source: string;
}

interface TariffResult {
  hs_code: string;
  description: string;
  country_of_origin: string;
  general_rate: number;
  section_301_rate: number;
  ieepa_rate: number;
  reciprocal_rate: number;
  total_rate: number;
  status: string;
  tariff_sources: TariffSource[];
  reciprocal_explanation?: string;
}

interface TariffCalculatorProps {
  onComplete: (itemData: {
    id: string;
    hts_number: string;
    country_of_origin: string;
    description: string;
    value: string;
    basic_duty_rate: string;
    section_301_rate: string;
    other_rate: string;
  }) => void;
  initialDescription?: string;
  initialValue?: string;
}

export function TariffCalculator({
  onComplete,
  initialDescription = '',
  initialValue = '1000'
}: TariffCalculatorProps) {
  const [step, setStep] = useState<'search' | 'calculating' | 'result'>('search');
  const [description, setDescription] = useState(initialDescription);
  const [value, setValue] = useState(initialValue);
  const [hsCode, setHsCode] = useState('');
  const [hsDescription, setHsDescription] = useState('');
  const [generalRate, setGeneralRate] = useState(0);
  const [calculationResult, setCalculationResult] = useState<TariffResult | null>(null);
  const [calculationSteps, setCalculationSteps] = useState<
    Array<{ name: string; status: 'pending' | 'processing' | 'completed' | 'error'; message?: string }>
  >([
    { name: 'Basic duty rate', status: 'pending' },
    { name: 'Section 301 tariff', status: 'pending' },
    { name: 'IEEPA tariff', status: 'pending' },
    { name: 'Reciprocal tariff', status: 'pending' },
  ]);

  const handleHsCodeSelect = (code: string, desc: string, rate: number) => {
    setHsCode(code);
    setHsDescription(desc);
    setGeneralRate(rate);
    
    // Update basic duty rate step to completed immediately after HS code selection
    updateCalculationStep('Basic duty rate', 'completed', `${rate}% based on Harmonized Tariff Schedule`);
    
    // Now calculate tariffs using the tariff server
    calculateTariffs(code, desc);
  };

  // Helper function to update calculation steps
  const updateCalculationStep = (name: string, status: 'pending' | 'processing' | 'completed' | 'error', message?: string) => {
    setCalculationSteps((prev) =>
      prev.map((step) =>
        step.name === name ? { ...step, status, message } : step
      )
    );
  };

  const calculateTariffs = async (code: string, desc: string) => {
    setStep('calculating');
    
    try {
      // Add delays between steps for better visual feedback
      const simulateStepDelay = async (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      };
      
      // Start Section 301 calculation
      updateCalculationStep('Section 301 tariff', 'processing');
      updateCalculationStep('IEEPA tariff', 'pending');
      updateCalculationStep('Reciprocal tariff', 'pending');
      
      // Add a short delay to make the loading screen visible to users
      await simulateStepDelay(2500);
      
      // Call the tariff server to calculate all applicable tariffs
      const response = await fetch('http://localhost:5001/api/calculate-all-tariffs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hs_code: code,
          description: desc,
          country_of_origin: 'CN',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate tariffs');
      }

      const result = await response.json();
      setCalculationResult(result);
      
      // Process each tariff source with visual feedback and delays
      const processTariffSteps = async () => {
        // Process Section 301 tariff first
        const section301Source = result.tariff_sources.find((source: TariffSource) => source.name === 'Section 301 tariff');
        updateCalculationStep('Section 301 tariff', 'completed', 
          section301Source ? `${section301Source.rate}% based on ${section301Source.source}` : '20% - Default AD/CVD rate for China');
        
        // Wait a moment before starting IEEPA calculation
        await simulateStepDelay(1500);
        
        // Start IEEPA calculation
        updateCalculationStep('IEEPA tariff', 'processing');
        await simulateStepDelay(2000);
        
        // Complete IEEPA calculation
        const ieepaSource = result.tariff_sources.find((source: TariffSource) => source.name === 'IEEPA tariff');
        updateCalculationStep('IEEPA tariff', 'completed', 
          ieepaSource ? `${ieepaSource.rate}% based on ${ieepaSource.source}` : '20% - Default IEEPA rate');
        
        // Wait a moment before starting Reciprocal calculation  
        await simulateStepDelay(1500);
        
        // Start Reciprocal tariff calculation
        updateCalculationStep('Reciprocal tariff', 'processing');
        await simulateStepDelay(2000);
        
        // Complete Reciprocal calculation
        const reciprocalSource = result.tariff_sources.find((source: TariffSource) => source.name === 'Reciprocal tariff');
        updateCalculationStep('Reciprocal tariff', 'completed', 
          reciprocalSource ? `${reciprocalSource.rate}% based on ${reciprocalSource.source}` : '125% - Default Reciprocal Tariff rate');
        
        // Final delay before showing results
        await simulateStepDelay(1000);
        
        // Show results
        setStep('result');
      };
      
      // Start the sequential processing
      processTariffSteps();
    } catch (error) {
      console.error('Error calculating tariffs:', error);
      toast.error('Failed to calculate tariffs');
      setStep('search');
    }
  };

  const handleComplete = () => {
    if (!calculationResult) return;
    
    // Create the item data with all necessary tariff rate information
    onComplete({
      id: `item-${Date.now()}`,
      hts_number: hsCode,
      country_of_origin: 'CN',
      description: description || hsDescription,
      value: value,
      // A. HTSUS Rate
      basic_duty_rate: calculationResult.general_rate.toString(),
      generalRate: calculationResult.general_rate.toString(),
      
      // B. AD/CVD Rate
      section_301_rate: calculationResult.section_301_rate.toString(),
      adcvdRate: calculationResult.section_301_rate.toString(),
      
      // C. IRC Rate (combination of IEEPA and Reciprocal)
      other_rate: (calculationResult.ieepa_rate + calculationResult.reciprocal_rate).toString(),
      ircRate: (calculationResult.ieepa_rate + calculationResult.reciprocal_rate).toString(),
      
      // Store individual rates for potential separate use
      ieepa_rate: calculationResult.ieepa_rate.toString(),
      reciprocal_rate: calculationResult.reciprocal_rate.toString(),
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {step === 'search' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tariff Calculator</h2>
            <p className="mt-1 text-sm text-gray-500">
              First, let's find the correct HS code for your product.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Item Value (USD)
              </label>
              <input
                type="text"
                id="value"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Your Product Description
              </label>
              <input
                type="text"
                id="description"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter your product description"
              />
            </div>
          </div>
          
          <HsCodeSearch onSelect={handleHsCodeSelect} />
        </div>
      )}

      {step === 'calculating' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Calculating Tariffs</h2>
            <p className="mt-1 text-sm text-gray-500">
              Please wait while we calculate tariff rates for HS code {hsCode}.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text-sm text-blue-700">
                    Selected HS Code: <span className="font-medium">{hsCode}</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced visual data source indicators */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Active Data Sources</h3>
              </div>
              
              <div className="p-4 space-y-3">
                {/* USTR Section 301 Source */}
                <div className={`flex items-center transition-opacity duration-1000 ${
                  calculationSteps.find(s => s.name === 'Section 301 tariff')?.status === 'processing' 
                    ? 'opacity-100' 
                    : 'opacity-60'
                }`}>
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">USTR Section 301 Search</h4>
                      {calculationSteps.find(s => s.name === 'Section 301 tariff')?.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Querying https://ustr.gov/issue-areas/enforcement/section-301-investigations/search</p>
                    {calculationSteps.find(s => s.name === 'Section 301 tariff')?.status === 'processing' && (
                      <div className="mt-2 text-xs text-gray-600 animate-pulse">
                        Extracting AD/CVD rate information for HS code {hsCode}...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* IEEPA Source */}
                <div className={`flex items-center transition-opacity duration-1000 ${
                  calculationSteps.find(s => s.name === 'IEEPA tariff')?.status === 'processing' 
                    ? 'opacity-100' 
                    : 'opacity-60'
                }`}>
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">U.S. CBP IEEPA Database</h4>
                      {calculationSteps.find(s => s.name === 'IEEPA tariff')?.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Accessing International Emergency Economic Powers Act data</p>
                    {calculationSteps.find(s => s.name === 'IEEPA tariff')?.status === 'processing' && (
                      <div className="mt-2 text-xs text-gray-600 animate-pulse">
                        Analyzing IEEPA emergency tariff applicability for HS code {hsCode}...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Reciprocal Source */}
                <div className={`flex items-center transition-opacity duration-1000 ${
                  calculationSteps.find(s => s.name === 'Reciprocal tariff')?.status === 'processing' 
                    ? 'opacity-100' 
                    : 'opacity-60'
                }`}>
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">Reciprocal Tariff Database</h4>
                      {calculationSteps.find(s => s.name === 'Reciprocal tariff')?.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Querying latest Reciprocal Tariff Act data</p>
                    {calculationSteps.find(s => s.name === 'Reciprocal tariff')?.status === 'processing' && (
                      <div className="mt-2 text-xs text-gray-600 animate-pulse">
                        Retrieving 2025 Reciprocal Tariff rates for Chinese imports...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Calculation Progress Steps */}
            <div className="space-y-4 mt-6">
              <h3 className="text-sm font-medium text-gray-700 pl-4">Calculation Progress</h3>
              {calculationSteps.map((step, index) => (
                <div key={step.name} className="relative">
                  {index > 0 && (
                    <div className="absolute top-0 left-4 -ml-px mt-0 h-full w-0.5 bg-gray-200" aria-hidden="true"></div>
                  )}
                  <div className="relative flex items-start group">
                    <div className="h-9 flex items-center">
                      <div className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full ${
                        step.status === 'pending' ? 'bg-white border-2 border-gray-300' :
                        step.status === 'processing' ? 'bg-blue-200 border-2 border-blue-400' :
                        step.status === 'completed' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}>
                        {step.status === 'pending' && (
                          <span className="h-2.5 w-2.5 bg-gray-300 rounded-full"></span>
                        )}
                        {step.status === 'processing' && (
                          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {step.status === 'completed' && (
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {step.status === 'error' && (
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 ml-4 text-sm">
                      <div>
                        <p className={`font-medium ${
                          step.status === 'pending' ? 'text-gray-500' :
                          step.status === 'processing' ? 'text-blue-600' :
                          step.status === 'completed' ? 'text-green-700' :
                          'text-red-700'
                        }`}>
                          {step.name}
                        </p>
                        {step.message && (
                          <p className="text-gray-500 mt-0.5">{step.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Loading note */}
            <div className="text-center text-sm text-gray-500 mt-4 italic animate-pulse">
              Retrieving official tariff data from multiple government sources. This may take a moment...
            </div>
          </div>
        </div>
      )}

      {step === 'result' && calculationResult && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tariff Calculation Results</h2>
            <p className="mt-1 text-sm text-gray-500">
              Here are the calculated tariff rates for your product.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">HS Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{calculationResult.hs_code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{description || calculationResult.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Country of Origin</dt>
                <dd className="mt-1 text-sm text-gray-900">China (CN)</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Value</dt>
                <dd className="mt-1 text-sm text-gray-900">${value}</dd>
              </div>
            </dl>
          </div>
          
          <div className="overflow-hidden border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tariff Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Basic Duty Rate</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculationResult.general_rate}%</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Harmonized Tariff Schedule</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Section 301 Tariff</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculationResult.section_301_rate}%</td>
                  <td className="px-6 py-4 text-sm text-gray-500">USTR Section 301 Investigation</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">IEEPA Tariff</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculationResult.ieepa_rate}%</td>
                  <td className="px-6 py-4 text-sm text-gray-500">International Emergency Economic Powers Act</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Reciprocal Tariff</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculationResult.reciprocal_rate}%</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Reciprocal Tariff Act</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Tariff Rate</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{calculationResult.total_rate}%</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Sum of all applicable tariffs</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {calculationResult.reciprocal_explanation && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-md font-medium text-gray-900 mb-2">Tariff Research Details</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {calculationResult.reciprocal_explanation}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleComplete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Item with Calculated Tariffs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}