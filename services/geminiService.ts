
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const solveMathWithAI = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Solve this math problem or explain this expression: "${prompt}". Provide a concise step-by-step breakdown. Use Markdown formatting for clarity.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "I'm sorry, I couldn't process that expression.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with AI Assistant.");
  }
};
