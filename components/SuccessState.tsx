import React from 'react';

interface SuccessStateProps {
  dataLength: number;
  fileName: string | null;
  onReset: () => void;
  onDownload: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ 
  dataLength, 
  fileName, 
  onReset, 
  onDownload 
}) => (
  <div className="space-y-6 animate-fade-in">
    <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-800">
      <p>
        <span className="font-bold">Success!</span> Extracted {dataLength} rows from <span className="font-medium">{fileName}</span>.
      </p>
    </div>
    <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
      <button
        onClick={onReset}
        className="w-full sm:w-auto text-slate-600 hover:text-slate-800 font-semibold py-2 px-4 rounded-lg transition duration-300"
      >
        Process Another File
      </button>
      <button
        onClick={onDownload}
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Download as Excel
      </button>
    </div>
  </div>
);
