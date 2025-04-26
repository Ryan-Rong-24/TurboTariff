import { NextResponse } from 'next/server';

interface TariffCalculation {
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

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items data' },
        { status: 400 }
      );
    }

    // Mock tariff calculations
    const calculations: TariffCalculation[] = items.map((item: any) => {
      const rate = 7.5; // Mock rate
      const value = item.quantity * (item.weight * 10); // Mock value calculation
      const totalDuty = value * (rate / 100);
      const mpf = Math.min(Math.max(value * 0.003464, 29.66), 575.16);
      const hmf = value * 0.00125;

      return {
        hsCode: item.hsCode || "3304.10.0000",
        description: item.description,
        rate,
        country: "US",
        effectiveDate: new Date().toISOString().split('T')[0],
        totalDuty,
        mpf,
        hmf,
        totalFees: totalDuty + mpf + hmf,
      };
    });

    return NextResponse.json({
      calculations,
      summary: {
        totalDuty: calculations.reduce((sum, calc) => sum + calc.totalDuty, 0),
        totalMpf: calculations.reduce((sum, calc) => sum + calc.mpf, 0),
        totalHmf: calculations.reduce((sum, calc) => sum + calc.hmf, 0),
        totalFees: calculations.reduce((sum, calc) => sum + calc.totalFees, 0),
      },
    });
  } catch (error: any) {
    console.error('Error calculating tariffs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate tariffs' },
      { status: 500 }
    );
  }
} 