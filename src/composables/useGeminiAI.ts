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

export function useGeminiAI() {
    const isThinking = ref(false);
    const aiThought = ref('');
    const aiTaunt = ref('');
    const error = ref<string | null>(null);

    const getBestMove = async (fen: string, legalMoves: string[], history: string[]) => {
        if (!API_KEY) {
            error.value = "Missing Gemini API Key";
            return null;
        }

        isThinking.value = true;
        error.value = null;
        aiThought.value = '';

        // Construct the prompt
        const prompt = `
You are a Chess Grandmaster playing Black.
Current FEN: "${fen}"
Legal Moves for Black: ${JSON.stringify(legalMoves)}
Game History: ${JSON.stringify(history.slice(-10))} (Last 10 moves)

Analyze the position deeply. Identify threats, opportunities, and positional advantages.
Select the single best move from the legal moves list to defeat the opponent (White).

Return your response strictly in the following JSON format (no markdown code blocks):
{
  "move": "e7e5", 
  "thought": "Brief strategic reasoning...",
  "taunt": "A short, witty, or slightly arrogant comment to the opponent."
}
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
