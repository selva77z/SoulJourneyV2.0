import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development'
});

export interface ParsedBirthData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  confidence: number;
  notes?: string;
}

export async function parseNaturalLanguagePrompt(prompt: string): Promise<ParsedBirthData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting birth data from natural language for astrological chart generation. Extract the following information from the user's prompt:

1. Name (full name if available)
2. Birth date (convert to YYYY-MM-DD format)
3. Birth time (convert to HH:MM format, 24-hour)
4. Birth place (full location with city, state/province, country)
5. Confidence level (0-100% how sure you are about the extracted data)

Rules:
- If birth time is not specified, use "12:00" as default
- If year is not specified but age is mentioned, calculate the birth year
- Always provide the most complete location possible
- If information is missing or unclear, note it in the confidence score
- Return JSON format only

Example output:
{
  "name": "John Smith",
  "birthDate": "1990-03-15",
  "birthTime": "14:30",
  "birthPlace": "Mumbai, Maharashtra, India",
  "confidence": 95,
  "notes": "All information clearly provided"
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name || "",
      birthDate: result.birthDate || "",
      birthTime: result.birthTime || "12:00",
      birthPlace: result.birthPlace || "",
      confidence: result.confidence || 0,
      notes: result.notes || ""
    };
  } catch (error) {
    console.error("Error parsing natural language prompt:", error);
    throw new Error("Failed to parse natural language prompt: " + (error as Error).message);
  }
}