import React, { useState, ChangeEvent, useRef } from 'react';
import * as XLSX from 'xlsx';
import { extractDataFromFile } from './services/geminiService';
import type { StatementRow } from './types';
import DataTable from './components/DataTable';
import Spinner from './components/Spinner';

export default function App() {
  const [data, setData] = useState<StatementRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
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

  const StatusDisplay: React.FC = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 text-slate-600 p-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
          <Spinner />
          <p className="font-medium text-lg">Analyzing your document...</p>
          <p className="text-sm text-slate-500">This may take a moment. Please wait.</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-lg" role="alert">
          <p className="font-bold">An Error Occurred</p>
          <p>{error}</p>
        </div>
      );
    }
    if (!data && !loading) {
      return (
        <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-lg">
          <p className="text-slate-500 font-medium">Upload a statement to begin data extraction.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center font-sans text-slate-800">
      <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-5xl">
        <header className="text-center border-b border-slate-200 pb-6 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">AI CMI Statement Extractor</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Upload your CMI statement (PDF or image) to automatically convert transactions into an accounting journal format, ready for Excel.
          </p>
        </header>

        <section className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <label
            htmlFor="file-upload"
            className={`w-full sm:w-auto cursor-pointer font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 text-slate-100 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {loading ? 'Processing...' : 'Upload Statement'}
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={loading}
          />
          {fileName && !loading && !error && <p className="text-sm text-slate-500 font-medium">Selected: {fileName}</p>}
        </section>

        <section className="space-y-6">
          <StatusDisplay />
          
          {data && (
            <div className="space-y-6 animate-fade-in">
              <DataTable data={data} />
              <div className="flex justify-end">
                <button
                  onClick={handleDownloadExcel}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105 shadow-md flex items-center gap-2"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download as Excel
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
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
