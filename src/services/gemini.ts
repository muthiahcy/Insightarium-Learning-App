import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { WahanaContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateWahanaContent(topic: string): Promise<WahanaContent> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Create a learning playground package for: "${topic}".
    Requirements:
    1. 10 Quiz questions with VERY brief explanations (max 2 sentences).
    2. 5 Flashcards (front: term/keyword, back: explanation).
    3. 5 Flashcard Evaluation questions (Multiple Choice) based on the flashcards.
    
    CRITICAL: Randomize correct answer positions. Keep all text concise to ensure fast generation.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ["front", "back"]
            }
          },
          flashcardEval: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        },
        required: ["quiz", "flashcards", "flashcardEval"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as WahanaContent;
}
