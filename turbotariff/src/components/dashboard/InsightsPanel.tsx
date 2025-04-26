'use client';

import React from 'react';

interface TariffRate {
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

interface RiskFactor {
  category: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

interface InsightsPanelProps {
  tariffRates: TariffRate[];
  riskFactors: RiskFactor[];
  summary?: {
    totalDuty: number;
    totalMpf: number;
    totalHmf: number;
    totalFees: number;
  };
}

export function InsightsPanel({ tariffRates, riskFactors, summary }: InsightsPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Tariff Summary</h3>
        {summary && (
          <div className="mt-4 bg-white border rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Duty</p>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ${summary.totalDuty.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">MPF</p>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ${summary.totalMpf.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">HMF</p>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ${summary.totalHmf.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Fees</p>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ${summary.totalFees.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Tariff Rates</h3>
        <div className="mt-4 space-y-4">
          {tariffRates.map((rate) => (
            <div
              key={rate.hsCode}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {rate.description}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    HS Code: {rate.hsCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {rate.rate}%
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {rate.country} • Effective {rate.effectiveDate}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Duty</p>
                  <p className="font-medium">${rate.totalDuty.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">MPF</p>
                  <p className="font-medium">${rate.mpf.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">HMF</p>
                  <p className="font-medium">${rate.hmf.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Risk Management</h3>
        <div className="mt-4 space-y-4">
          {riskFactors.map((risk) => (
            <div
              key={risk.category}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {risk.category}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {risk.description}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    risk.level === 'low'
                      ? 'bg-green-100 text-green-800'
                      : risk.level === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {risk.level}
                </span>
              </div>
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-900">
                  Recommendation
                </h5>
                <p className="mt-1 text-sm text-gray-500">
                  {risk.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 