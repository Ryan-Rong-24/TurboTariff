import { useState } from 'react';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';

interface TariffFormState {
  step: 'upload' | 'preview' | 'processing' | 'results';
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    weight: number;
    imageUrl?: string;
    hsCode?: string;
    suggestions?: any;
  }>;
  insights?: any;
  pdfUrl?: string;
}

export function useTariffForm() {
  const [state, setState] = useState<TariffFormState>({
    step: 'upload',
    items: [],
  });

  const { addPackingList, setCurrentPackingList } = useStore();

  const addItem = () => {
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 0,
          weight: 0,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setState((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      // Simulate image upload and processing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const imageUrl = URL.createObjectURL(file);
      updateItem(index, 'imageUrl', imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const generateSuggestions = async (index: number) => {
    try {
      // Simulate AI suggestions
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const suggestions = {
        improvedDescription: 'Improved product description',
        suggestedHsCode: '1234.56.78',
        confidence: 0.95,
      };
      updateItem(index, 'suggestions', suggestions);
      toast.success('Suggestions generated successfully');
    } catch (error) {
      toast.error('Failed to generate suggestions');
    }
  };

  const submitForm = async () => {
    try {
      setState((prev) => ({ ...prev, step: 'processing' }));

      // Simulate form processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const packingList = {
        id: Date.now().toString(),
        items: state.items,
        status: 'completed' as const,
        pdfUrl: '/sample.pdf',
        insights: {
          totalItems: state.items.length,
          totalWeight: state.items.reduce((sum, item) => sum + item.weight, 0),
          averageTariffRate: 5.5,
          riskLevel: 'Low',
        },
      };

      addPackingList(packingList);
      setCurrentPackingList(packingList);

      setState((prev) => ({
        ...prev,
        step: 'results',
        insights: packingList.insights,
        pdfUrl: packingList.pdfUrl,
      }));

      toast.success('Tariff form generated successfully');
    } catch (error) {
      toast.error('Failed to generate tariff form');
      setState((prev) => ({ ...prev, step: 'preview' }));
    }
  };

  const resetForm = () => {
    setState({
      step: 'upload',
      items: [],
    });
  };

  return {
    state,
    addItem,
    updateItem,
    removeItem,
    handleImageUpload,
    generateSuggestions,
    submitForm,
    resetForm,
  };
} 