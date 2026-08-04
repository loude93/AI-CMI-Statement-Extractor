import React, { ChangeEvent, DragEvent, useRef } from 'react';
import { useFileProcessor } from './hooks/useFileProcessor';
import DataTable from './components/DataTable';
import { FileDropzone } from './components/FileDropzone';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { SuccessState } from './components/SuccessState';
import { downloadAsExcel } from './utils/excelUtils';

export default function App() {
  const { data, loading, error, fileName, isDragging, processFile, resetState, setIsDragging } = useFileProcessor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDownloadExcel = () => {
    if (!data) return;
    downloadAsExcel(data);
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingState fileName={fileName} />;
    }

    if (error) {
      return <ErrorState error={error} onRetry={resetState} />;
    }

    if (data) {
      return (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-800">
            <p>
              <span className="font-bold">Success!</span> Extracted {data.length} rows from <span className="font-medium">{fileName}</span>.
            </p>
          </div>
          <DataTable data={data} />
          <SuccessState 
            dataLength={data.length}
            fileName={fileName}
            onReset={resetState}
            onDownload={handleDownloadExcel}
          />
        </div>
      );
    }
    
    return (
      <FileDropzone
        onFileSelect={processFile}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        disabled={loading}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center font-sans text-slate-800">
      <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-5xl">
        <header className="text-center border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">AI CMI Statement Extractor</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Upload your CMI statement (PDF or image) to automatically convert transactions into an accounting journal format, ready for Excel.
          </p>
        </header>

        <section className="space-y-6">
          {renderContent()}
        </section>
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Powered by MAISSINE Mohammed. Built for efficiency.</p>
      </footer>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
