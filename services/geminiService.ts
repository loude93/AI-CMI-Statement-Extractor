import type { StatementRow } from '../types';

export const extractDataFromFile = async (fileBase64: string, fileType: string): Promise<StatementRow[]> => {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileBase64, fileType })
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error || 'An error occurred while processing the statement.';
    throw new Error(message);
  }

  return payload as StatementRow[];
};
