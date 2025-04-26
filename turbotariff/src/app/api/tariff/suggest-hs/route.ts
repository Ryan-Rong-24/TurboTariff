import { NextResponse } from 'next/server';

interface SuggestionRequest {
  description: string;
  imageUrl?: string;
  existingHsCode?: string;
}

interface HsSuggestion {
  code: string;
  description: string;
  confidence: number;
  source: string;
  alternatives: Array<{
    code: string;
    description: string;
    confidence: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, imageUrl, existingHsCode }: SuggestionRequest = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Simulate AI processing for HS code suggestions
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const suggestion: HsSuggestion = {
      code: '8471.30.00',
      description: 'Portable automatic data processing machines',
      confidence: 0.95,
      source: 'AI Model v1.0',
      alternatives: [
        {
          code: '8471.41.00',
          description: 'Other automatic data processing machines',
          confidence: 0.85,
        },
        {
          code: '8471.49.00',
          description: 'Other automatic data processing machines presented in the form of systems',
          confidence: 0.75,
        },
      ],
    };

    // If an image was provided, we would use it to enhance the suggestions
    if (imageUrl) {
      suggestion.confidence += 0.03;
      suggestion.source += ' with image analysis';
    }

    // If an existing HS code was provided, we would use it for validation
    if (existingHsCode) {
      suggestion.alternatives.unshift({
        code: existingHsCode,
        description: 'Current classification',
        confidence: 0.90,
      });
    }

    return NextResponse.json({
      suggestion,
      processingTime: '2.1s',
      modelVersion: '1.0.0',
    });
  } catch (error) {
    console.error('Error generating HS code suggestions:', error);
    return NextResponse.json(
      { error: 'Error generating HS code suggestions' },
      { status: 500 }
    );
  }
} 