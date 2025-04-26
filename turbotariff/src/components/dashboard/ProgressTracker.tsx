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
                  ) : (
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {step.title}
                </div>
                {step.details && (
                  <div className="mt-1 text-sm text-gray-500">{step.details}</div>
                )}
                {step.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={step.imageUrl}
                      alt={step.title}
                      className="rounded-lg shadow-sm max-w-sm"
                    />
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