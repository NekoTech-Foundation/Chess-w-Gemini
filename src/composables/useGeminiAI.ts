import { ref } from 'vue';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the API client
// Note: In a real app, ensure the key is present.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ],
});

import { getOpeningMove } from '../utils/openingBook';

export function useGeminiAI() {
    const isThinking = ref(false);
    const aiThought = ref('');
    const aiTaunt = ref('');
    const error = ref<string | null>(null);

    // RPM management
    const lastRequestTime = ref(0);
    const MIN_REQUEST_INTERVAL = 4000; // 4 seconds minimum between turns

    const getBestMove = async (fen: string, legalMoves: string[] = []) => {
        if (!API_KEY) {
            error.value = "Missing Gemini API Key";
            return null;
        }

        isThinking.value = true;
        error.value = null;
        aiThought.value = '';


        // Check Opening Book first
        const bookMove = getOpeningMove(fen);
        if (bookMove) {
            // Simulate thinking delay for realism
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
            aiThought.value = "Khai cuộc bài bản. Tôi đã thuộc lòng biến thể này.";
            aiTaunt.value = "Bạn nghĩ có thể đánh lừa tôi ở khai cuộc sao?";
            isThinking.value = false;
            return bookMove;
        }

        // Enforce Artificial Delay for RPM
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime.value;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
            // Don't busy-wait, just set a timeout if this wasn't an async function, 
            // but here we can just sleep.
            // Actually, we should sleep *part* of the time here, then call API.
            await new Promise(r => setTimeout(r, waitTime));
        }
        lastRequestTime.value = Date.now();

        // Construct the prompt - STATELESS (No history)
        const prompt = `
You are a Grandmaster chess engine playing Black.
Current board state (FEN): "${fen}"
Valid moves: ${JSON.stringify(legalMoves)}

Analyze the position deeply. Identify threats, hanging pieces, and tactical opportunities.
Return ONLY a strictly valid JSON object. Do NOT use markdown code blocks.
Format:
{
  "move": "e2e4", 
  "thought": "Brief strategic reasoning in Vietnamese",
  "taunt": "A short, witty taunt in Vietnamese"
}
Key requirement: The 'move' MUST be in UCI format (e.g., e7e5, g8f6) and MUST be one of the valid moves provided.
`.trim();

        // Retry wrapper for API calls
        const makeApiCall = async (fullPrompt: string, retries = 3, delay = 1000): Promise<string> => {
            try {
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            } catch (err: any) {
                if (retries > 0 && (err.message.includes('503') || err.message.includes('429'))) {
                    console.warn(`Gemini API Error (${err.message}). Retrying in ${delay}ms... (${retries} retries left)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return makeApiCall(fullPrompt, retries - 1, delay * 2);
                }
                throw err;
            }
        };

        try {
            const text = await makeApiCall(prompt);

            console.log("Gemini Raw Response:", text);

            if (!text || !text.trim()) {
                console.warn("Gemini returned empty text.");
                throw new Error("Empty response from AI");
            }

            // Attempt to clean markdown if present
            // Use regex to find the JSON object part
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            let cleanedText = text;

            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            } else {
                // Fallback cleanup if regex fails
                cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            const parsed = JSON.parse(cleanedText);

            aiThought.value = parsed.thought;
            aiTaunt.value = parsed.taunt;

            return parsed.move;

        } catch (err: any) {
            console.error("Gemini AI Error:", err);
            // More user-friendly error message
            error.value = "AI failed. " + (err.message.includes('503') ? 'Server overloaded.' : err.message);

            // Fallback: Pick a random move if AI fails?
            if (legalMoves.length > 0) {
                // Short delay to simulate "thinking" before fallback
                await new Promise(r => setTimeout(r, 500));

                const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                aiThought.value = "I am distracted... I'll just play this.";
                return randomMove;
            }
            return null;
        } finally {
            isThinking.value = false;
        }
    };

    return {
        isThinking,
        aiThought,
        aiTaunt,
        error,
        getBestMove
    };
}
