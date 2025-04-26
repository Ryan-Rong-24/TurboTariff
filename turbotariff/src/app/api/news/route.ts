import { NextResponse } from 'next/server';

// Mock data - replace with actual news API integration
const news = [
  {
    id: '1',
    title: 'US Announces New Tariff Rates for Electronics',
    date: '2024-03-15',
    source: 'Trade News Daily',
    summary: 'The US government has announced updated tariff rates for electronic goods, effective from April 2024.',
    url: 'https://example.com/news/1',
  },
  {
    id: '2',
    title: 'EU Implements New Customs Regulations',
    date: '2024-03-10',
    source: 'European Trade Journal',
    summary: 'New customs regulations come into effect across the European Union, affecting import/export procedures.',
    url: 'https://example.com/news/2',
  },
  {
    id: '3',
    title: 'Global Trade Agreement Updates',
    date: '2024-03-05',
    source: 'International Trade Review',
    summary: 'Major updates to global trade agreements expected to impact tariff classifications and rates.',
    url: 'https://example.com/news/3',
  },
];

export async function GET() {
  try {
    return NextResponse.json(news);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
} 