import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

// Initialize the Gemini API client
// Note: In a real application, ensure the API key is securely managed.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Processes an image of a credit card bill or receipt and extracts structured data.
 * This function demonstrates the OCR and data extraction logic using Gemini.
 */
export async function extractTransactionData(base64Image: string, mimeType: string): Promise<ExtractedData[] | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this document (image or PDF) of a credit card bill, invoice, or receipt.
CRITICAL INSTRUCTION: You must extract EVERY SINGLE LINE ITEM or transaction found in the document. Do not summarize. Do not skip any items. If there is a table of expenses, extract every row. Ignore payment received confirmations, only extract expenses/charges. Ensure the JSON array contains ALL transactions, even if there are many (do not truncate).
Return the extracted data as a structured JSON array of objects.
For each transaction, extract:
- establishment: The name of the store, service, or description of the charge.
- date: The date and time of the transaction in ISO format (YYYY-MM-DDTHH:mm:ss). If time is not present, use 00:00:00. If only day/month is present, infer the year from the document context or use the current year.
- totalValue: The amount of the transaction (as a positive number).
- isInstallment: Boolean indicating if it's an installment purchase (e.g., "1/10" or "parcela 1 de 10").
- currentInstallment: If it's an installment, which one is it? (number).
- totalInstallments: If it's an installment, what is the total number of installments? (number).
- type: Classify as 'fixed' (e.g., subscriptions, recurring bills) or 'variable' (e.g., dining, shopping).
- category: A general category for the expense (e.g., 'Food', 'Transport', 'Entertainment', 'Subscriptions', 'Shopping', 'Health', 'Other').`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              establishment: { type: Type.STRING, description: "Name of the store or service" },
              date: { type: Type.STRING, description: "Date in YYYY-MM-DDTHH:mm:ss format" },
              totalValue: { type: Type.NUMBER, description: "Transaction amount" },
              isInstallment: { type: Type.BOOLEAN, description: "True if it is an installment purchase" },
              currentInstallment: { type: Type.NUMBER, description: "Current installment number, if applicable" },
              totalInstallments: { type: Type.NUMBER, description: "Total number of installments, if applicable" },
              type: { type: Type.STRING, enum: ["fixed", "variable"], description: "Whether the expense is fixed or variable" },
              category: { type: Type.STRING, description: "Expense category" },
            },
            required: ["establishment", "date", "totalValue", "isInstallment", "type", "category"],
          }
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as ExtractedData[];
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error extracting data with Gemini:", error);
    return null;
  }
}
