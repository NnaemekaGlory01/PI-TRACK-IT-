import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function checkDrugInteractions(drugNames: string[]) {
  if (drugNames.length < 2) return null;

  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Check for drug interactions between the following drugs: ${drugNames.join(", ")}. 
    Provide a clear warning if interactions exist, explain the risk, and suggest alternatives if applicable.
    Format the response as JSON with the following structure:
    {
      "hasInteraction": boolean,
      "severity": "low" | "medium" | "high",
      "warning": "string",
      "risk": "string",
      "alternatives": "string"
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const response = await model;
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error checking drug interactions:", error);
    return null;
  }
}
