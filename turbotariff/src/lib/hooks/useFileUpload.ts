import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { uploadFile, isValidFileType, formatFileSize } from '../upload';

interface UseFileUploadOptions {
  allowedTypes?: string[];
  maxSize?: number;
  onUploadComplete?: (url: string, key: string) => void;
  onUploadError?: (error: Error) => void;
}

export function useFileUpload({
  allowedTypes = [],
  maxSize = 5 * 1024 * 1024, // 5MB
  onUploadComplete,
  onUploadError,
}: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        toast.error('No valid files selected');
        return;
      }

      const file = acceptedFiles[0];

      if (!isValidFileType(file, allowedTypes)) {
        toast.error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }

      if (file.size > maxSize) {
        toast.error(`File size exceeds ${formatFileSize(maxSize)}`);
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const { url, key } = await uploadFile(file);
        setUploadProgress(100);
        onUploadComplete?.(url, key);
        toast.success('File uploaded successfully');
      } catch (error) {
        onUploadError?.(error as Error);
        toast.error('Failed to upload file');
      } finally {
        setIsUploading(false);
      }
    },
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isUploading,
    uploadProgress,
  };
} 