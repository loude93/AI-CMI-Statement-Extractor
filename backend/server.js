import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const loadDotEnvLocal = () => {
  const envPath = path.join(rootDir, '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equals = line.indexOf('=');
    if (equals === -1) {
      continue;
    }

    const key = line.slice(0, equals).trim();
    const value = line.slice(equals + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadDotEnvLocal();

const PORT = Number(process.env.PORT || 8787);

const prompt = `
You are an expert financial data analyst tasked with converting CMI (Centre Monétique Interbancaire) statement transactions into a specific accounting journal format.
Analyze the provided document (image or PDF). For each transaction group related to a TPE (Terminal de Paiement Electronique), you must generate four distinct rows corresponding to "TOTAL REMISE", "COMMISSIONS HT", "TVA SUR COMMISSIONS", and "SOLDE NET REMISE".

Follow these rules precisely for each transaction group you identify:

1.  **Identify Key Information**: From each transaction group, extract the TPE number (it is often labeled as "POINT DE VENTE N."), the transaction date, the remittance number (if available), card info (if available), and the amounts for each of the four components.
2.  **Date Format Rule**: The date for ALL generated rows MUST be strictly in DD/MM/YYYY format.
3.  **Construct the 'Libellé'**: The 'Libellé' for each of the four rows must be a combination of the TPE number, remittance number, card info (like last 4 digits), and the specific description (e.g., "TOTAL REMISE").
4.  **Generate Four Rows with Specific Accounting Logic**.
5.  **Final Output**: Return a single JSON array containing all the generated objects. Do not include explanatory text.
`;

const json = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
};

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY. Add it to .env.local before processing documents.');
  }
  return new GoogleGenAI({ apiKey });
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    return json(res, 404, { error: 'Not found' });
  }

  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && req.url === '/api/extract') {
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
      }

      const body = raw ? JSON.parse(raw) : {};
      const { fileBase64, fileType } = body;

      if (!fileBase64 || !fileType) {
        return json(res, 400, { error: 'fileBase64 and fileType are required.' });
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: fileBase64,
                mimeType: fileType
              }
            }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                compteGeneral: { type: Type.STRING },
                compteTier: { type: Type.STRING },
                libelle: { type: Type.STRING },
                debit: { type: Type.STRING },
                credit: { type: Type.STRING }
              },
              required: ['date', 'compteGeneral', 'compteTier', 'libelle', 'debit', 'credit']
            }
          }
        }
      });

      const text = response.text.trim();
      if (!text) {
        return json(res, 422, { error: 'The AI returned an empty response.' });
      }

      return json(res, 200, JSON.parse(text));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      return json(res, 500, { error: message });
    }
  }

  return json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
