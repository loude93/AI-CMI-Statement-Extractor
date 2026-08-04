import * as XLSX from 'xlsx';
import type { StatementRow } from '../types';

export const convertToExcelFormat = (data: StatementRow[]) => {
  return data.map(row => ({
    'DATE': row.date,
    'COMPTE GENERAL': row.compteGeneral,
    'COMPTE TIER': row.compteTier,
    'LIBELLE': row.libelle,
    'DEBIT': row.debit ? parseFloat(row.debit.replace(/\./g, '').replace(',', '.')) : null,
    'CREDIT': row.credit ? parseFloat(row.credit.replace(/\./g, '').replace(',', '.')) : null
  }));
};

export const downloadAsExcel = (data: StatementRow[], filename: string = 'cmi_statement_data.xlsx'): void => {
  const dataForExport = convertToExcelFormat(data);
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
  XLSX.writeFile(workbook, filename);
};
