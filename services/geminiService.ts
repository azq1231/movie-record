import { GoogleGenAI } from "@google/genai";
import { GeminiShowDetails } from "../types";

export const fetchShowDetailsWithAI = async (title: string): Promise<GeminiShowDetails | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key not found. Returning default details.");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    // More permissive prompt to ensure we get data even if keke1 is not indexed.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find details for the TV show or Drama named "${title}".
      
      Task:
      1. Search the web for the show's plot summary, genres, airing status, and an official poster image URL.
      2. **Source Preference**: The user prefers "keke1.app" (可可影視). IF a search result from "keke1.app" is available, use it.
      3. **Fallback Strategy**: IF "keke1.app" is not found in the top results, **YOU MUST USE ANY OTHER RELIABLE SOURCE** (e.g., Douban, Wikipedia, Yahoo Drama, Baidu) to retrieve the details. **DO NOT FAIL**.
      4. **Language**: The description MUST be in **Traditional Chinese (繁體中文)**.

      Output Requirements:
      - Return ONLY a valid JSON object.
      - Do not include markdown formatting like \`\`\`json.
      - Do not include conversational filler or apologies.

      JSON Structure:
      {
        "description": "Plot summary in Traditional Chinese...",
        "genres": ["Genre1", "Genre2"],
        "statusSuggestion": "Status (e.g., 連載中, 已完結)",
        "posterUrl": "https://..." // URL to a poster image
      }`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text;
    if (!text) return null;

    // Clean up potential markdown code blocks if the model ignores instructions
    text = text.replace(/```json|```/g, '').trim();
    // Sometimes models add a text prefix, try to find the first {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    let details: GeminiShowDetails;
    try {
      details = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", text);
      // Fallback if parsing fails
      return {
        description: "無法獲取詳細資訊，請手動輸入。",
        genres: ["未知"],
        statusSuggestion: "未知",
      };
    }

    // Extract Search Grounding Metadata (Source URL)
    // We take the first web source found to attribute it
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const webSource = groundingChunks.find((chunk: any) => chunk.web?.uri);
      if (webSource && webSource.web) {
        details.source = {
          title: webSource.web.title || "資料來源",
          url: webSource.web.uri,
        };
      }
    }

    return details;

  } catch (error) {
    console.error("Error fetching show details from Gemini:", error);
    return null;
  }
};