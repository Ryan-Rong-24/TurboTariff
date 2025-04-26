'use client';

import React from 'react';
import { toast } from 'react-hot-toast';

interface Suggestion {
  originalDescription: string;
  improvedDescription: string;
  hsCode: string;
  confidence: number;
  reasoning: string;
}

interface SmartSuggestionsProps {
  item: {
    description: string;
    imageUrl?: string;
  };
  onAccept: (suggestion: Suggestion) => void;
}

export function SmartSuggestions({ item, onAccept }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!item.description || item.description.trim().length < 3) {
        return; // Don't fetch for very short descriptions
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Call the actual API endpoint
        const response = await fetch('/api/smart-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: item.description,
            imageUrl: item.imageUrl,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get suggestions');
        }
        
        const data = await response.json();
        
        // Format the response into our suggestion format
        const suggestion: Suggestion = {
          originalDescription: item.description,
          improvedDescription: data.improvedDescription || item.description,
          hsCode: data.hsCode || '',
          confidence: data.confidence || 0.5,
          reasoning: data.reasoning || 'No reasoning provided',
        };
        
        setSuggestions([suggestion]);
      } catch (error: any) {
        console.error('Error fetching suggestions:', error);
        setError(error.message || 'Failed to fetch suggestions');
        toast.error('Failed to fetch suggestions');
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call to prevent too many requests
    const timerId = setTimeout(() => {
      if (item.description) {
        fetchSuggestions();
      }
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [item.description, item.imageUrl]);

  if (loading) {
    return (
      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
        <div className="flex justify-between items-start mb-2">
          <div className="w-3/4">
            <div className="h-4 bg-blue-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-blue-200 rounded w-full"></div>
          </div>
          <div className="h-6 w-16 bg-blue-200 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-blue-200 rounded w-1/3"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-2">
      {suggestions.map((suggestion, index) => (
        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h4 className="text-sm font-medium text-blue-900">Improved Description</h4>
              <p className="mt-1 text-sm text-blue-700 break-words">{suggestion.improvedDescription}</p>
            </div>
            <button
              onClick={() => onAccept(suggestion)}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              Accept
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Suggested HS Code</h4>
              <p className="mt-1 text-sm text-blue-700 font-mono">{suggestion.hsCode}</p>
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <span className="text-sm text-blue-900 mr-2">Confidence:</span>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${suggestion.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-blue-900">{Math.round(suggestion.confidence * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-white bg-opacity-50 rounded p-3 border border-blue-100">
            <h4 className="text-sm font-medium text-blue-900">Reasoning</h4>
            <p className="mt-1 text-sm text-blue-700 whitespace-pre-wrap break-words">
              {suggestion.reasoning}
            </p>
          </div>
          
          <div className="flex justify-end mt-3">
            <button
              onClick={() => onAccept(suggestion)}
              className="text-sm text-blue-700 hover:text-blue-900 underline"
            >
              Apply these suggestions
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 