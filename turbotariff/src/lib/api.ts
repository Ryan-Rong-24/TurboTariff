import { toast } from 'react-hot-toast';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function uploadPackingList(file: File): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);
    
    const response = await fetch('/api/upload-packing-list', {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Upload error:', responseData);
      throw new Error(responseData.error || 'Failed to upload file');
    }

    console.log('Upload response:', responseData);
    return { data: responseData };
  } catch (error: any) {
    console.error('Upload exception:', error);
    toast.error(`Failed to upload packing list: ${error.message}`);
    return { error: error.message || 'Unknown error occurred' };
  }
}

export async function getSmartSuggestions(description: string, imageUrl?: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/smart-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }

    return { data: await response.json() };
  } catch (error: any) {
    toast.error('Failed to get smart suggestions');
    return { error: error.message || 'Unknown error occurred' };
  }
}

export async function calculateTariffs(items: any[]): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/calculate-tariffs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate tariffs');
    }

    return { data: await response.json() };
  } catch (error: any) {
    toast.error('Failed to calculate tariffs');
    return { error: error.message || 'Unknown error occurred' };
  }
}

export async function generateTariffForm(data: any): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/generate-tariff-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to generate tariff form');
    }

    return { data: await response.json() };
  } catch (error: any) {
    toast.error('Failed to generate tariff form');
    return { error: error.message || 'Unknown error occurred' };
  }
}

export async function getComplianceDates(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/compliance-dates');
    if (!response.ok) {
      throw new Error('Failed to fetch compliance dates');
    }
    return { data: await response.json() };
  } catch (error: any) {
    toast.error('Failed to fetch compliance dates');
    return { error: error.message || 'Unknown error occurred' };
  }
}

export async function getNews(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/news');
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    return { data: await response.json() };
  } catch (error: any) {
    toast.error('Failed to fetch news');
    return { error: error.message || 'Unknown error occurred' };
  }
} 