import React from 'react';

interface LoadingStateProps {
  fileName: string | null;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ fileName }) => (
  <div className="flex flex-col items-center justify-center space-y-4 text-slate-600 p-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="font-medium text-lg">Analyzing: {fileName}</p>
    <p className="text-sm text-slate-500">This may take a moment. Please wait.</p>
  </div>
);
