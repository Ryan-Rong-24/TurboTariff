import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { description, imageUrl } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Construct the prompt for the LLM
    const prompt = `Given the following product description${imageUrl ? ' and image' : ''}, provide:
1. An improved, more detailed description that includes specifications, materials, and features
2. The most appropriate HS code (Harmonized System code) for customs classification
3. A confidence score (0-1) of your classification
4. Detailed reasoning for the classification

Description: ${description}
${imageUrl ? `Image URL: ${imageUrl}` : ''}

For HS codes:
- Use the correct format with dots (e.g., "8517.12.0000" or "9403.20.0000")
- Be as specific as possible with the full 8-10 digit code
- Consider country of origin (assume China if unclear)

For the improved description:
- Keep it under 100 words but include all important details
- Mention materials, dimensions, and functionality
- Use proper terminology that matches customs documentation

IMPORTANT: You MUST return valid JSON with no explanations before or after. Your entire response should be parseable JSON with the following structure:
{
  "improvedDescription": "string",
  "hsCode": "string",
  "confidence": number,
  "reasoning": "string"
}`;

    // Call the LLM
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse the response
    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    let suggestion;
    
    try {
      // Attempt to parse the content as JSON
      suggestion = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // If parsing fails, extract the JSON part from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          suggestion = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error('Failed to extract JSON:', extractError);
          // Fallback to a default suggestion
          suggestion = {
            improvedDescription: description,
            hsCode: "",
            confidence: 0.5,
            reasoning: "Could not determine classification automatically."
          };
        }
      } else {
        // If all else fails, return a default fallback
        suggestion = {
          improvedDescription: description,
          hsCode: "",
          confidence: 0.5,
          reasoning: "Could not determine classification automatically."
        };
      }
    }

    return NextResponse.json(suggestion);
  } catch (error: any) {
    console.error('Error getting suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get suggestions' },
      { status: 500 }
    );
  }
} 