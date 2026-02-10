
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStockAndSales = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze the following EESAA Weighing Scales inventory and sales data. Identify low stock trends, best performing branches, and provide 3 actionable business recommendations: ${JSON.stringify(data)}`,
      config: {
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to analyze data at this time.";
  }
};

export const chatWithAssistant = async (message: string, context: any) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are the EESAA Smart Assistant. Help the company management with billing, stock, and reporting questions. You have access to the current business context: ${JSON.stringify(context)}. Keep responses professional and concise.`,
    },
  });
  
  const response = await chat.sendMessage({ message });
  return response.text;
};

export const generateEmailDraft = async (invoice: any, customer: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a professional, warm, and concise email to a customer for EESAA Weighing Scales.
      Invoice Details: ${JSON.stringify(invoice)}
      Customer Details: ${JSON.stringify(customer)}
      
      Requirements:
      1. Subject line should be clear (e.g., Invoice #... from EESAA Scales).
      2. If it is a CREDIT bill, mention the total outstanding amount of ₹${customer.outstanding}.
      3. Keep the tone helpful and professional.
      4. End with a polite signature from EESAA Management.`,
    });
    return response.text;
  } catch (error) {
    console.error("Email Draft Error:", error);
    return `Subject: Invoice ${invoice.invoiceNumber} from EESAA Scales\n\nDear ${customer.name},\n\nPlease find the attached invoice for your recent purchase. Your total outstanding is ₹${customer.outstanding}.\n\nBest regards,\nEESAA Management`;
  }
};

export const searchIndustryTrends = async (query: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find the latest trends and market prices for: ${query}`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
