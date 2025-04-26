'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function DashboardPage() {
  // Recent forms data (mock data, would come from a real API in production)
  const recentForms = [
    { id: 'form-abc123', description: 'Three-seater sofa', date: 'Apr 26, 2025', status: 'completed' },
    { id: 'form-def456', description: 'Brass table lamp', date: 'Apr 25, 2025', status: 'completed' },
  ];

  // Upcoming compliance dates (mock data)
  const upcomingDates = [
    { id: 'date-123', title: 'Section 301 Tariff Renewal', date: 'May 15, 2025' },
    { id: 'date-456', title: 'HTS Update Release', date: 'Jun 1, 2025' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Welcome to TurboTariff</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your intelligent tariff management solution
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/packing-lists" className="block p-6 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                <h3 className="text-lg font-medium text-blue-900">Generate Tariff Form</h3>
                <p className="mt-2 text-sm text-blue-700">Upload a packing list and generate a CBP Form 7501</p>
              </Link>
              
              <Link href="/calendar" className="block p-6 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition">
                <h3 className="text-lg font-medium text-green-900">Calendar & News</h3>
                <p className="mt-2 text-sm text-green-700">Track compliance dates and latest tariff news</p>
              </Link>
              
              <Link href="/history" className="block p-6 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition">
                <h3 className="text-lg font-medium text-purple-900">Form History</h3>
                <p className="mt-2 text-sm text-purple-700">Review and download your previously generated forms</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent activity section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent forms */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Forms</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest tariff form submissions</p>
              </div>
              <Link href="/history" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {recentForms.map((form) => (
                  <li key={form.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{form.description}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          form.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {form.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Generated on {form.date}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <a href="/output/completed_form.pdf" download className="text-blue-600 hover:text-blue-500">
                          Download
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Upcoming dates */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Dates</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Important compliance dates and deadlines</p>
              </div>
              <Link href="/calendar" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View calendar
              </Link>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {upcomingDates.map((event) => (
                  <li key={event.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Due on {event.date}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 