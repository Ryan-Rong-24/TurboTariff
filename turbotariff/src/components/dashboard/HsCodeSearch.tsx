'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface HsCodeResult {
  hs_code: string;
  description: string;
  general_rate: number;
  similarity_score: number;
}

interface HsCodeSearchProps {
  onSelect: (hsCode: string, description: string, generalRate: number) => void;
}

export function HsCodeSearch({ onSelect }: HsCodeSearchProps) {
  const [description, setDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<HsCodeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!description.trim()) {
      toast.error('Please enter a product description');
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5001/api/search-hs-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          top_n: 10,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search for HS codes');
      }

      setResults(data.results || []);
      
      if (data.results.length === 0) {
        toast.error('No matching HS codes found');
      }
    } catch (error) {
      console.error('Error searching for HS codes:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast.error('Failed to search for HS codes');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCode = (result: HsCodeResult) => {
    onSelect(result.hs_code, result.description, result.general_rate);
    toast.success(`Selected HS code: ${result.hs_code}`);
    setResults([]);
    setDescription('');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Search for HS Code</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Product Description
          </label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a detailed product description (e.g., 'leather handbag with zipper closure')"
          />
        </div>
        
        <div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Results</h4>
            <div className="overflow-hidden border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HS Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.hs_code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.hs_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{result.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.general_rate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(result.similarity_score * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectCode(result)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}