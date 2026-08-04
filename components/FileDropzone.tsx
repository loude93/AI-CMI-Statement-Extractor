import React, { useCallback } from 'react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  isDragging,
  setIsDragging,
  disabled = false,
}) => {
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [setIsDragging]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !disabled) {
      onFileSelect(file);
    }
  }, [onFileSelect, setIsDragging, disabled]);

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
      }`}
    >
      <div className="text-center space-y-2">
        <svg className="w-16 h-16 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p className="font-semibold text-slate-700">Drag & drop your CMI statement here</p>
        <p className="text-sm text-slate-500">PDF, PNG, JPG files are supported</p>
        <p className="text-sm text-slate-400 py-2">or</p>
      </div>
      <button
        onClick={() => {
          const input = document.getElementById('file-upload') as HTMLInputElement | null;
          input?.click();
        }}
        className="mt-2 font-semibold py-2 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md bg-blue-600 hover:bg-blue-700 text-white"
        disabled={disabled}
      >
        Select File
      </button>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && !disabled) {
            onFileSelect(file);
          }
        }}
        accept=".pdf,.png,.jpg,.jpeg"
        disabled={disabled}
      />
    </div>
  );
};
