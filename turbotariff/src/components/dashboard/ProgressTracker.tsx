'use client';

import React from 'react';

interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  details?: string;
  imageUrl?: string;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
}

export function ProgressTracker({ steps }: ProgressTrackerProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {index < steps.length - 1 && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-16 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
            <div className="relative flex items-start">
              <div className="flex items-center h-8">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step.status === 'completed'
                      ? 'bg-green-500'
                      : step.status === 'in-progress'
                      ? 'bg-blue-500'
                      : step.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-200'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : step.status === 'error' ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : step.status === 'in-progress' ? (
                    <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <div className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-700' : 
                  step.status === 'in-progress' ? 'text-blue-700' : 
                  step.status === 'error' ? 'text-red-700' : 
                  'text-gray-700'
                }`}>
                  {step.title}
                  {step.status === 'in-progress' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
                
                {step.details && (
                  <div className={`mt-1 text-sm ${
                    step.status === 'in-progress' ? 'text-gray-600 animate-pulse' : 'text-gray-500'
                  }`}>
                    {step.details}
                  </div>
                )}
                
                {/* Visual indicators for in-progress steps */}
                {step.status === 'in-progress' && (
                  <div className="mt-2 relative">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden relative">
                      <div className="h-full bg-blue-500 rounded-full absolute animate-progress-bar" style={{width: '15%'}}></div>
                    </div>
                  </div>
                )}
                
                {/* Icons for completed steps */}
                {step.status === 'completed' && step.title.includes('Analyzing') && (
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Analysis complete
                  </div>
                )}
                
                {/* Image display */}
                {step.imageUrl && (
                  <div className="mt-3 mb-2">
                    <img
                      src={step.imageUrl}
                      alt={step.title}
                      className="rounded-lg shadow-sm max-h-16 border border-gray-200 bg-white p-1"
                    />
                  </div>
                )}
                
                {/* Data sources for tariff calculations */}
                {step.status === 'in-progress' && step.title.includes('Tariff') && (
                  <div className="mt-2 text-xs text-gray-500 animate-pulse">
                    Connecting to government tariff databases...
                  </div>
                )}
                
                {/* Form generation indicator */}
                {step.status === 'in-progress' && step.title.includes('Forms') && (
                  <div className="mt-2 text-xs text-gray-500 animate-pulse">
                    Generating CBP Form 7501 with calculated tariff rates...
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 