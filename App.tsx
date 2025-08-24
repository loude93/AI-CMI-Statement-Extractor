import React, { useState, ChangeEvent, useRef, DragEvent } from 'react';
import * as XLSX from 'xlsx';
import { extractDataFromFile } from './services/geminiService';
import type { StatementRow } from './types';
import DataTable from './components/DataTable';
import Spinner from './components/Spinner';

// New component for the upload icon
const UploadIcon = () => (
  <svg className="w-16 h-16 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);


export default function App() {
  const [data, setData] = useState<StatementRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) {
      return;
    }

    // Check file type
    const acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!acceptedTypes.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Please upload a PDF or image file.`);
      return;
    }

    setData(null);
    setError(null);
    setLoading(true);
    setFileName(file.name);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const extracted = await extractDataFromFile(base64, file.type);
          
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      setLoading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow dropping
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleDownloadExcel = () => {
    if (!data) return;

    const dataForExport = data.map(row => ({
      'DATE': row.date,
      'COMPTE GENERAL': row.compteGeneral,
      'COMPTE TIER': row.compteTier,
      'LIBELLE': row.libelle,
      'DEBIT': row.debit ? parseFloat(row.debit.replace(/\./g, '').replace(',', '.')) : null,
      'CREDIT': row.credit ? parseFloat(row.credit.replace(/\./g, '').replace(',', '.')) : null
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);

    const columnWidths = [
      { wch: 15 }, // DATE
      { wch: 20 }, // COMPTE GENERAL
      { wch: 20 }, // COMPTE TIER
      { wch: 80 }, // LIBELLE
      { wch: 15 }, // DEBIT
      { wch: 15 }, // CREDIT
    ];
    worksheet['!cols'] = columnWidths;
    
    // Set number format for Debit and Credit columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C of [4, 5]) { // Columns E (Debit) and F (Credit)
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (worksheet[cell_ref] && (worksheet[cell_ref].v !== null)) {
                worksheet[cell_ref].t = 'n';
                worksheet[cell_ref].z = '#,##0.00';
            }
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CMI Statement');
    XLSX.writeFile(workbook, 'cmi_statement_data.xlsx');
  };

  const resetState = () => {
    setData(null);
    setError(null);
    setFileName(null);
    setLoading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 text-slate-600 p-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
          <Spinner />
          <p className="font-medium text-lg">Analyzing: {fileName}</p>
          <p className="text-sm text-slate-500">This may take a moment. Please wait.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-lg" role="alert">
            <p className="font-bold">An Error Occurred</p>
            <p>{error}</p>
          </div>
          <div className="text-center">
            <button
                onClick={resetState}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
            >
                Try Again
            </button>
          </div>
        </div>
      );
    }

    if (data) {
      return (
         <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-800">
                <p>
                    <span className="font-bold">Success!</span> Extracted {data.length} rows from <span className="font-medium">{fileName}</span>.
                </p>
            </div>
            <DataTable data={data} />
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
                <button
                    onClick={resetState}
                    className="w-full sm:w-auto text-slate-600 hover:text-slate-800 font-semibold py-2 px-4 rounded-lg transition duration-300"
                >
                    Process Another File
                </button>
                <button
                  onClick={handleDownloadExcel}
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
    }
    
    // Initial state: Dropzone
    return (
       <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
      >
        <div className="text-center space-y-2">
            <UploadIcon />
            <p className="font-semibold text-slate-700">Drag & drop your CMI statement here</p>
            <p className="text-sm text-slate-500">PDF, PNG, JPG files are supported</p>
            <p className="text-sm text-slate-400 py-2">or</p>
        </div>
        <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 font-semibold py-2 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md bg-blue-600 hover:bg-blue-700 text-white"
        >
            Select File
        </button>
        <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={loading}
        />
       </div>
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
