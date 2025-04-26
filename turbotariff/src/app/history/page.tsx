'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useStore, FormHistoryItem } from '@/lib/store';

export default function HistoryPage() {
  const getFormHistory = useStore(state => state.getFormHistory);
  const [forms, setForms] = useState<FormHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get stored form history
    const storedForms = getFormHistory();
    
    if (storedForms.length > 0) {
      setForms(storedForms);
      setLoading(false);
    } else {
      // If no forms in history, use mock data
      setTimeout(() => {
        // Mock data for demonstration
        const mockForms: FormHistoryItem[] = [
          {
            id: 'form-' + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            hsCode: '94016100',
            description: 'Three-seater sofa with removable cushions',
            value: 5100,
            dutyAmount: 546.03,
            status: 'completed',
            pdfUrl: '/output/completed_form.pdf'
          },
          {
            id: 'form-' + Math.random().toString(36).substr(2, 9),
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            hsCode: '94052091',
            description: 'Antique brass table lamp with fabric shade',
            value: 2500,
            dutyAmount: 250.75,
            status: 'completed',
            pdfUrl: '/output/completed_form.pdf'
          },
          {
            id: 'form-' + Math.random().toString(36).substr(2, 9),
            date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
            hsCode: '85167100',
            description: 'Espresso machine with milk frother',
            value: 3200,
            dutyAmount: 298.40,
            status: 'completed',
            pdfUrl: '/output/completed_form.pdf'
          }
        ];
        
        setForms(mockForms);
        setLoading(false);
      }, 1000);
    }
  }, [getFormHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Form History</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all tariff forms you've generated, including their status and details.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/packing-lists"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Generate New Form
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="mt-6 animate-pulse">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <div className="border-t border-gray-300">
                <div className="bg-gray-50 p-5 h-16"></div>
                <div className="bg-white p-5 h-16"></div>
                <div className="bg-gray-50 p-5 h-16"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Description
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          HS Code
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Value
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Duty Amount
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {forms.map((form) => (
                        <tr key={form.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                            {formatDate(form.date)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {form.description}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {form.hsCode}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ${form.value.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ${form.dutyAmount.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                              ${form.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : form.status === 'error' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'}`}>
                              {form.status}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <a href={form.pdfUrl} download={`CBP_Form_7501_${form.id}.pdf`} className="text-blue-600 hover:text-blue-900 mr-4">
                              Download
                            </a>
                            <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}