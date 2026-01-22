import { ref } from 'vue';
import { Chess } from 'chess.js';
import { getOpeningMove } from '../utils/openingBook';
import { useGeminiAI } from './useGeminiAI';

// Fallback phrases for Stockfish
// Fallback phrases for Stockfish
const FALLBACK_PHRASES = {
    check: [
        'Chiếu nè cưng! Chạy đi đâu?',
        'Vua của bạn đang gặp nguy, lo mà đỡ đi!',
        'Đừng hòng thoát, chiếu tướng!',
        'Cẩn thận cái đầu của Vua nhé!'
    ],
    capture: [
        'Ăn nè! Quân này ngon quá.',
        'Cảm ơn vì món quà nhé!',
        'Đổi quân lời rồi!',
        'Sai lầm đắt giá đấy, mình xin con này.'
    ],
    normal: [
        'Nước này bạn tính bao lâu rồi?',
        'Để xem bạn đỡ nước này thế nào.',
        'Cờ bí dí tốt à?',
        'Bạn đánh cũng được đấy, nhưng chưa đủ trình đâu.',
        'Nước đi thú vị, nhưng mình đã tính trước rồi.',
        'Cẩn thận đấy, mình đang gài bẫy đó.'
    ],
    switch_mode: [
        'Mạng lag quá, tôi bật "God Mode" (Stockfish) đây!',
        'Gemini đi nghỉ mát rồi, giờ bạn sẽ đấu với trùm cuối Stockfish!',
        'Hết quota API rồi, để mình dùng thuật toán "bón hành" cho bạn.'
    ]
};

export function useChessAI(game: Chess) {
    const isGeminiDead = ref(false);
    const aiComment = ref('');
    const aiStatus = ref<'thinking' | 'idle'>('idle');

    // Initialize Gemini Composables
    const { getBestMove: getGeminiMove } = useGeminiAI();

    // Initialize Stockfish Worker
    const stockfish = new Worker('/stockfish/stockfish.js');

    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    const generateLocalCommentary = (chessInstance: Chess, moveUCI: string) => {
        const tempGame = new Chess(chessInstance.fen());
        try {
            // Handle UCI (e.g., e2e4)
            const from = moveUCI.substring(0, 2);
            const to = moveUCI.substring(2, 4);
            const promotion = moveUCI.substring(4) || undefined;

            const move = tempGame.move({ from: from as any, to: to as any, promotion: (promotion || 'q') as any });
            if (!move) return "Nước đi lỗi rồi!";

            if (tempGame.isCheckmate()) return "Chiếu hết! Game over!";
            if (tempGame.isCheck()) return getRandom(FALLBACK_PHRASES.check);
            if (move.captured) return getRandom(FALLBACK_PHRASES.capture);

            return getRandom(FALLBACK_PHRASES.normal);
        } catch (e) {
            return "Thinking...";
        }
    };

    const callStockfish = (fen: string): Promise<string> => {
        return new Promise((resolve) => {
            stockfish.postMessage(`position fen ${fen}`);
            stockfish.postMessage('go depth 10');

            stockfish.onmessage = (event) => {
                const line = event.data;
                if (line && line.startsWith('bestmove')) {
                    const move = line.split(' ')[1];
                    resolve(move);
                }
            };
        });
    };

    const getBestMove = async (fen: string, legalMoves: string[]): Promise<{ move: string; thought: string; taunt: string; source: 'book' | 'gemini' | 'stockfish' }> => {
        aiStatus.value = 'thinking';

        try {
            // 1. Opening Book
            const bookMove = getOpeningMove(fen);
            if (bookMove) {
                // Simulate delay
                await new Promise(r => setTimeout(r, 800));
                return {
                    move: bookMove,
                    thought: "Opening Book Move",
                    taunt: "Khai cuộc bài bản đấy!",
                    source: 'book'
                };
            }

            // 2. Gemini
            if (!isGeminiDead.value) {
                try {
                    const geminiResult = await getGeminiMove(fen, legalMoves);
                    if (geminiResult) {
                        return {
                            move: geminiResult.move,
                            thought: geminiResult.thought || "Analyzing...",
                            taunt: geminiResult.taunt || "...",
                            source: 'gemini'
                        };
                    }
                } catch (error: any) {
                    console.warn("Gemini Failed, switching to Stockfish...", error);
                    isGeminiDead.value = true;
                    aiComment.value = getRandom(FALLBACK_PHRASES.switch_mode);
                }
            }

            // 3. Stockfish Fallback
            const sfMove = await callStockfish(fen);
            const taunt = generateLocalCommentary(game, sfMove);
            return {
                move: sfMove,
                thought: "Stockfish Engine Calculation (Depth 10)",
                taunt: isGeminiDead.value ? (taunt + " (Fallback Mode)") : taunt,
                source: 'stockfish'
            };

        } finally {
            aiStatus.value = 'idle';
        }
    };

    return {
        getBestMove,
        isGeminiDead,
        aiStatus
    };
}
