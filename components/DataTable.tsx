import React from 'react';
import type { StatementRow } from '../types';

interface DataTableProps {
  data: StatementRow[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-md">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Compte General</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Compte Tier</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Libellé</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Débit</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Crédit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-mono">{row.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-mono">{row.compteGeneral}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-mono">{row.compteTier}</td>
              <td className="px-6 py-4 text-sm text-slate-800 max-w-xs truncate" title={row.libelle}>{row.libelle}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-mono">{row.debit}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-mono">{row.credit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
