import { GoogleGenAI, Type } from '@google/genai';
import type { StatementRow } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
};

export const extractDataFromFile = async (fileBase64: string, fileType: string): Promise<StatementRow[]> => {
  const filePart = fileToGenerativePart(fileBase64, fileType);

  const prompt = `
    You are an expert financial data analyst tasked with converting CMI (Centre Monétique Interbancaire) statement transactions into a specific accounting journal format.
    Analyze the provided document (image or PDF). For each transaction group related to a TPE (Terminal de Paiement Electronique), you must generate four distinct rows corresponding to "TOTAL REMISE", "COMMISSIONS HT", "TVA SUR COMMISSIONS", and "SOLDE NET REMISE".

    Follow these rules precisely for each transaction group you identify:

    1.  **Identify Key Information**: From each transaction group, extract the TPE number, the transaction date, the remittance number (if available), card info (if available), and the amounts for each of the four components.

    2.  **Construct the 'Libellé'**: The 'Libellé' for each of the four rows must be a combination of the TPE number, remittance number, card info (like last 4 digits), and the specific description (e.g., "TOTAL REMISE").

    3.  **Generate Four Rows with Specific Accounting Logic**:

        a. **For "TOTAL REMISE"**:
           - **DATE**: The transaction date.
           - **COMPTE GENERAL**: "34210000".
           - **COMPTE TIER**: "CMI" followed by the last 5 digits of the TPE number.
           - **LIBELLE**: The constructed description.
           - **DEBIT**: An empty string "".
           - **CREDIT**: The "TOTAL REMISE" amount, formatted as a string with a comma decimal separator.

        b. **For "COMMISSIONS HT"**:
           - **DATE**: The transaction date.
           - **COMPTE GENERAL**: "61740000".
           - **COMPTE TIER**: An empty string "".
           - **LIBELLE**: The constructed description.
           - **DEBIT**: The "COMMISSIONS HT" amount, formatted as a string with a comma decimal separator.
           - **CREDIT**: An empty string "".

        c. **For "TVA SUR COMMISSIONS"**:
           - **DATE**: The transaction date.
           - **COMPTE GENERAL**: "34552010".
           - **COMPTE TIER**: An empty string "".
           - **LIBELLE**: The constructed description.
           - **DEBIT**: The "TVA SUR COMMISSIONS" amount, formatted as a string with a comma decimal separator.
           - **CREDIT**: An empty string "".

        d. **For "SOLDE NET REMISE"**:
           - **DATE**: The transaction date.
           - **COMPTE GENERAL**: "34210000".
           - **COMPTE TIER**: "CMI" followed by the last 5 digits of the TPE number.
           - **LIBELLE**: The constructed description.
           - **DEBIT**: The "SOLDE NET REMISE" amount, formatted as a string with a comma decimal separator.
           - **CREDIT**: An empty string "".

    4.  **Final Output**: Return a single JSON array containing all the generated objects. Do not include any explanatory text, markdown, or summaries. The output must be only the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: prompt }, filePart]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Transaction date (DD/MM/YYYY)" },
              compteGeneral: { type: Type.STRING, description: "General account number based on rules" },
              compteTier: { type: Type.STRING, description: "Third-party account, if applicable" },
              libelle: { type: Type.STRING, description: "Combined transaction description" },
              debit: { type: Type.STRING, description: "Debit amount" },
              credit: { type: Type.STRING, description: "Credit amount" }
            },
            required: ["date", "compteGeneral", "compteTier", "libelle", "debit", "credit"]
          }
        }
      }
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("The AI returned an empty response. The document might be unreadable or not a CMI statement.");
    }
    const extractedData = JSON.parse(jsonText) as StatementRow[];
    return extractedData;

  } catch (error) {
    console.error("Error extracting data from Gemini:", error);
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('json')) {
            throw new Error("The AI returned an invalid format. Please try a clearer image or a different file.");
        }
         throw new Error(`An error occurred while processing the statement: ${error.message}`);
    }
    throw new Error("An unknown error occurred during AI processing.");
  }
};