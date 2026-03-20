import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function checkDrugInteractions(drugNames: string[]) {
  if (drugNames.length < 2) return { interactions: [] };

  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a clinical pharmacist assistant. Check for potential drug-drug interactions between the following medications: ${drugNames.join(", ")}. 
    
    Identify all clinically significant interactions between any pairs of these drugs. 
    Include common and critical interactions (e.g., Warfarin and Vitamin K, NSAIDs and Anticoagulants, etc.).
    
    Format the response as a valid JSON object with the following structure:
    {
      "interactions": [
        {
          "drugA": "Name of the first drug",
          "drugB": "Name of the second drug",
          "severity": "low" | "medium" | "high",
          "description": "Detailed clinical explanation of the interaction risk",
          "recommendation": "Professional recommendation for the pharmacist (e.g., monitor, avoid, adjust dose)"
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const response = await model;
    const text = response.text || '{"interactions": []}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Error checking drug interactions:", error);
    return { interactions: [] };
  }
}

export async function predictDrugUsage(salesData: any[]) {
  if (salesData.length === 0) return null;

  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the following sales data from a pharmacy, predict future drug usage and demand. 
    Identify trends, seasonal patterns, and suggest which drugs should be restocked soon.
    Data: ${JSON.stringify(salesData.slice(-50))}
    
    Format the response as JSON with the following structure:
    {
      "predictions": [
        { "drugName": "string", "predictedDemand": "high" | "medium" | "low", "reason": "string" }
      ],
      "insights": "string",
      "growthKPIs": "string"
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const response = await model;
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error predicting drug usage:", error);
    return null;
  }
}
