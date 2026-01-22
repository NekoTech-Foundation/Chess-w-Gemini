export const openingBook: Record<string, string> = {
    // Starting position
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": "e2e4", // e4 is standard

    // e4 responses
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1": "e7e5", // Classic Open Game
    // White plays Nf3
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1": "g1f3", // Nf3
    // Black plays Nc6
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 1": "b8c6", // Nc6

    // Ruy Lopez
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 2": "f1b5", // Bb5

    // Sicilian Defense
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1": "g1f3", // Nf3

    // French Defense / Caro-Kann could be added here
};

export const getOpeningMove = (fen: string): string | null => {
    // Return move if exact FEN match found in book
    return openingBook[fen] || null;
};
