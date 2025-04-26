import { NextResponse } from 'next/server';

interface TariffItem {
  description: string;
  quantity: number;
  weight: number;
  hsCode?: string;
}

interface TariffCalculation {
  rate: number;
  amount: number;
  currency: string;
  breakdown: {
    baseRate: number;
    adjustments: Array<{
      type: string;
      amount: number;
      reason: string;
    }>;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: TariffItem[] = body.items;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Simulate tariff calculation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const calculations = items.map((item) => ({
      rate: 5.5,
      amount: item.quantity * item.weight * 5.5,
      currency: 'USD',
      breakdown: {
        baseRate: 5.0,
        adjustments: [
          {
            type: 'trade_agreement',
            amount: 0.5,
            reason: 'Preferential trade agreement adjustment',
          },
        ],
      },
    }));

    return NextResponse.json({
      calculations,
      totalAmount: calculations.reduce((sum, calc) => sum + calc.amount, 0),
      currency: 'USD',
    });
  } catch (error) {
    console.error('Error calculating tariffs:', error);
    return NextResponse.json(
      { error: 'Error calculating tariffs' },
      { status: 500 }
    );
  }
} 