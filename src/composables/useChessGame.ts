import { ref, computed } from 'vue';
import { Chess, type Move } from 'chess.js';

export function useChessGame() {
    const chess = new Chess();

    // Reactive state
    const fen = ref(chess.fen());
    const turn = ref(chess.turn()); // 'w' or 'b'
    const isGameOver = ref(chess.isGameOver());
    const isCheckmate = ref(chess.isCheckmate());
    const isDraw = ref(chess.isDraw());

    // History as simple SAN strings for display
    const history = ref(chess.history());

    const board = computed(() => {
        // Depend on FEN to trigger re-render
        // eslint-disable-next-line no-unused-vars
        const _ = fen.value;
        return chess.board();
    });

    // Helper to force update reactive state
    const updateState = () => {
        fen.value = chess.fen();
        turn.value = chess.turn();
        isGameOver.value = chess.isGameOver();
        isCheckmate.value = chess.isCheckmate();
        isDraw.value = chess.isDraw();
        history.value = chess.history();
    };

    const resetGame = () => {
        chess.reset();
        updateState();
    };

    // Sound effects
    const playSound = (type: 'move' | 'capture' | 'notify') => {
        const audio = new Audio();
        switch (type) {
            case 'move': audio.src = '/move-self.mp3'; break;
            case 'capture': audio.src = '/capture.mp3'; break;
            case 'notify': audio.src = '/notify.mp3'; break; // Used for check/game over
        }
        audio.play().catch(e => console.error("Audio play failed:", e));
    };

    const makeMove = (move: string | { from: string; to: string; promotion?: string }) => {
        try {
            // Handle UCI string (e.g. "e2e4", "a7a8q") manually since chess.js .move() prefers SAN
            if (typeof move === 'string' && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
                const uciObject = {
                    from: move.substring(0, 2) as any,
                    to: move.substring(2, 4) as any,
                    promotion: (move.substring(4) || undefined) as any
                };
                // Try moving with object
                const result = chess.move(uciObject);
                if (result) {
                    updateState();
                    // Play sounds
                    if (chess.inCheck() || chess.isGameOver()) {
                        playSound('notify');
                    } else if (result.captured) {
                        playSound('capture');
                    } else {
                        playSound('move');
                    }
                    return result;
                }
            }

            // Standard SAN or Object move attempt
            const result = chess.move(move);
            if (result) {
                updateState();

                // Play sounds
                if (chess.inCheck() || chess.isGameOver()) {
                    playSound('notify');
                } else if (result.captured) {
                    playSound('capture');
                } else {
                    playSound('move');
                }

                return result;
            }
        } catch (e) {
            // Invalid move
            return null;
        }
        return null;
    };

    const getLegalMoves = (square?: string) => {
        return chess.moves({ square, verbose: true });
    };

    const getLegalMovesSAN = () => {
        return chess.moves();
    }

    return {
        chess, // Expose instance if needed
        fen,
        turn,
        isGameOver,
        isCheckmate,
        isDraw,
        history,
        board,
        boardState: computed(() => {
            // Depend on FEN to trigger re-render
            // eslint-disable-next-line no-unused-vars
            const _ = fen.value;
            return chess.board();
        }),
        makeMove,
        resetGame,
        getLegalMoves,
        getLegalMovesSAN,
    };
}
