import { ref } from 'vue';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the API client
// Note: In a real app, ensure the key is present.
// Initialize API Clients for Rotation
const env = import.meta.env;
const API_KEYS = [
    env.VITE_GEMINI_API_KEY,
    env.VITE_GEMINI_API_KEY_2,
    env.VITE_GEMINI_API_KEY_3,
    env.VITE_GEMINI_API_KEY_4,
    env.VITE_GEMINI_API_KEY_5
].filter(key => !!key) as string[];

const clients = API_KEYS.map(key => new GoogleGenerativeAI(key));
const models = clients.map(client => client.getGenerativeModel({
    model: "gemini-3-flash-preview",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
}));

let currentKeyIndex = 0;

export function useGeminiAI() {
    const isThinking = ref(false);
    const aiThought = ref('');
    const aiTaunt = ref('');
    const error = ref<string | null>(null);

    // RPM management
    const lastRequestTime = ref(0);
    const MIN_REQUEST_INTERVAL = 4000;

    // Helper to rotate key
    const rotateKey = () => {
        if (API_KEYS.length <= 1) return false;
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        console.warn(`Switching to API Key #${currentKeyIndex + 1}`);
        return true;
    };

    const getBestMove = async (fen: string, legalMoves: string[] = []) => {
        if (API_KEYS.length === 0) {
            error.value = "Missing Gemini API Keys";
            return null;
        }

        isThinking.value = true;
        error.value = null;
        aiThought.value = '';

        // Enforce Artificial Delay
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime.value;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
            await new Promise(r => setTimeout(r, waitTime));
        }
        lastRequestTime.value = Date.now();

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

        const makeApiCall = async (fullPrompt: string, retries = 3, delay = 1000): Promise<string> => {
            try {
                // Use current model instance
                const currentModel = models[currentKeyIndex];
                const result = await currentModel.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            } catch (err: any) {
                // If Rate Limited (429) or Server Error (503)
                if (err.message.includes('503') || err.message.includes('429')) {
                    console.warn(`Gemini API Error (${err.message}).`);

                    // Try rotating key first
                    if (rotateKey()) {
                        console.warn("Retrying with new key immediately...");
                        return makeApiCall(fullPrompt, retries, delay); // Don't decrement retries for key rotation, or maybe we should? Let's treat rotation as "free" attempt
                    }

                    // If no keys left or rotation useless, then backoff
                    if (retries > 0) {
                        console.warn(`Retrying in ${delay}ms... (${retries} retries left)`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return makeApiCall(fullPrompt, retries - 1, delay * 2);
                    }
                }
                throw err;
            }
        };

        try {
            const text = await makeApiCall(prompt);

            console.log("Gemini Raw Response:", text);

            if (!text || !text.trim()) {
                console.warn("Gemini returned empty text.");
                // Removed invalid PromptFeedback check to fix build (result is not in scope)
                throw new Error("Empty response from AI (likely safety block or 503)");
            }

            // Attempt to clean markdown if present
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            let cleanedText = text;

            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            } else {
                cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            const parsed = JSON.parse(cleanedText);

            // Note: We don't set state strings here anymore, just return data
            // But to keep compatibility if anyone uses these refs directly:
            aiThought.value = parsed.thought;
            aiTaunt.value = parsed.taunt;

            return {
                move: parsed.move,
                thought: parsed.thought,
                taunt: parsed.taunt
            };

        } catch (err: any) {
            console.error("Gemini AI Error:", err);
            // Throw error to let the orchestrator handle fallback (Stockfish)
            throw new Error(err.message || "Gemini API Failed");
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
