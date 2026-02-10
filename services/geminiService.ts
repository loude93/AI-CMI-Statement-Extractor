import type { StatementRow } from '../types';

export const extractDataFromFile = async (fileBase64: string, fileType: string, fileName?: string): Promise<StatementRow[]> => {
  let response: Response;

  try {
    response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileBase64, fileType, fileName })
    });
  } catch {
    throw new Error('Cannot reach backend API. Start the app with `npm run dev` so frontend and backend run together.');
  }

  const raw = await response.text();
  let payload: unknown = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    if (!response.ok) {
      throw new Error(`Backend request failed with status ${response.status}.`);
    }
    throw new Error('Backend returned an invalid response.');
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      ? String((payload as { error: string }).error)
      : 'An error occurred while processing the statement.';
    throw new Error(message);
  }

  return payload as StatementRow[];
};
