import { NextResponse } from 'next/server';

// Mock data - replace with actual data source
const complianceDates = [
  {
    id: '1',
    title: 'Quarterly Tariff Review',
    date: '2024-04-15',
    type: 'compliance',
    description: 'Review and update tariff classifications for Q2 2024',
  },
  {
    id: '2',
    title: 'New Trade Agreement Implementation',
    date: '2024-04-20',
    type: 'news',
    description: 'Implementation of new trade agreement between US and EU',
  },
  {
    id: '3',
    title: 'Customs Compliance Training',
    date: '2024-05-01',
    type: 'compliance',
    description: 'Annual customs compliance training for import/export staff',
  },
];

export async function GET() {
  try {
    return NextResponse.json(complianceDates);
  } catch (error: any) {
    console.error('Error fetching compliance dates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch compliance dates' },
      { status: 500 }
    );
  }
} 