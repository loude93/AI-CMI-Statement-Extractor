import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="space-y-4">
    <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-lg" role="alert">
      <p className="font-bold">An Error Occurred</p>
      <p>{error}</p>
    </div>
    <div className="text-center">
      <button
        onClick={onRetry}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
      >
        Try Again
      </button>
    </div>
  </div>
);
