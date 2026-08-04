import { useState, useCallback, useRef } from 'react';
import { extractDataFromFile } from '../services/geminiService';
import type { StatementRow } from '../types';

interface UseFileProcessorReturn {
  data: StatementRow[] | null;
  loading: boolean;
  error: string | null;
  fileName: string | null;
  isDragging: boolean;
  processFile: (file: File) => void;
  resetState: () => void;
  setIsDragging: (dragging: boolean) => void;
}

export const useFileProcessor = (): UseFileProcessorReturn => {
  const [data, setData] = useState<StatementRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file) return;

    const acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!acceptedTypes.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Please upload a PDF or image file.`);
      return;
    }

    setData(null);
    setError(null);
    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await extractDataFromFile(base64, file.type, file.name);
        
        if (extracted && extracted.length > 0) {
          setData(extracted);
        } else {
          setError("No data could be extracted from the document. It might be empty or in an unsupported format.");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during processing.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
      setLoading(false);
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const resetState = useCallback(() => {
    setData(null);
    setError(null);
    setFileName(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    data,
    loading,
    error,
    fileName,
    isDragging,
    processFile,
    resetState,
    setIsDragging,
  };
};
