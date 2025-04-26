import { useState, useEffect } from 'react';
import { useStore } from '../store';

interface TariffInsight {
  totalItems: number;
  totalWeight: number;
  averageTariffRate: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestedActions?: string[];
  complianceIssues?: string[];
}

export function useTariffInsights(packingListId: string) {
  const [insights, setInsights] = useState<TariffInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const { packingLists } = useStore();

  useEffect(() => {
    const generateInsights = async () => {
      try {
        setLoading(true);
        const packingList = packingLists.find((list) => list.id === packingListId);

        if (!packingList) {
          throw new Error('Packing list not found');
        }

        // Simulate AI-powered insights generation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const newInsights: TariffInsight = {
          totalItems: packingList.items.length,
          totalWeight: packingList.items.reduce((sum, item) => sum + item.weight, 0),
          averageTariffRate: 5.5,
          riskLevel: 'Low',
          suggestedActions: [
            'Consider bundling similar items to reduce tariff rates',
            'Review HS codes for accuracy',
            'Check for any applicable trade agreements',
          ],
          complianceIssues: [
            'Item descriptions could be more specific',
            'Some HS codes may need verification',
          ],
        };

        setInsights(newInsights);
      } catch (error) {
        console.error('Error generating insights:', error);
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, [packingListId, packingLists]);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskLevelDescription = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'Minimal compliance risk';
      case 'medium':
        return 'Moderate compliance risk';
      case 'high':
        return 'High compliance risk';
      default:
        return 'Unknown risk level';
    }
  };

  return {
    insights,
    loading,
    getRiskLevelColor,
    getRiskLevelDescription,
  };
} 