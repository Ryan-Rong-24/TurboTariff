import { useState } from 'react';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';

interface PdfOptions {
  includeInsights?: boolean;
  includeImages?: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export function usePdfGenerator() {
  const [generating, setGenerating] = useState(false);
  const { currentPackingList } = useStore();

  const generatePdf = async (options: PdfOptions = {}) => {
    if (!currentPackingList) {
      toast.error('No packing list selected');
      return null;
    }

    try {
      setGenerating(true);

      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pdfContent = {
        title: 'Tariff Form',
        date: new Date().toLocaleDateString(),
        items: currentPackingList.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          hsCode: item.hsCode || 'N/A',
        })),
        insights: options.includeInsights ? currentPackingList.insights : undefined,
        images: options.includeImages
          ? currentPackingList.items
              .filter((item) => item.imageUrl)
              .map((item) => ({
                description: item.description,
                url: item.imageUrl,
              }))
          : undefined,
      };

      // In a real implementation, this would generate an actual PDF
      // For now, we'll just return a mock URL
      const pdfUrl = '/sample.pdf';

      toast.success('PDF generated successfully');
      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = async (options: PdfOptions = {}) => {
    const pdfUrl = await generatePdf(options);
    if (pdfUrl) {
      // In a real implementation, this would trigger a download
      // For now, we'll just open the PDF in a new tab
      window.open(pdfUrl, '_blank');
    }
  };

  const previewPdf = async (options: PdfOptions = {}) => {
    const pdfUrl = await generatePdf(options);
    if (pdfUrl) {
      // In a real implementation, this would show a preview
      // For now, we'll just open the PDF in a new tab
      window.open(pdfUrl, '_blank');
    }
  };

  return {
    generating,
    generatePdf,
    downloadPdf,
    previewPdf,
  };
} 