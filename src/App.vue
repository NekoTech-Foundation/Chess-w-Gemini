<script setup lang="ts">
import { ref, watch } from 'vue';
import ChessBoard from './components/ChessBoard.vue';
import { useChessGame } from './composables/useChessGame';
import { useGeminiAI } from './composables/useGeminiAI';

const { 
  board, turn, isGameOver, isCheckmate, isDraw, fen, history, 
  makeMove, resetGame, getLegalMoves, getLegalMovesSAN 
} = useChessGame();

const { getBestMove, isThinking, aiThought, aiTaunt, error: aiError } = useGeminiAI();

const lastMove = ref<{ from: string; to: string } | null>(null);

const handleUserMove = async (move: { from: string; to: string }) => {
  if (isGameOver.value || turn.value !== 'w') return;

  const result = makeMove(move);
  if (result) {
    lastMove.value = move;
    // Trigger AI if game not over
    if (!isGameOver.value) {
      await playAI();
    }
  }
};

const playAI = async () => {
  if (isGameOver.value) return;

  const legalMoves = getLegalMovesSAN(); // ["e4", "Nf3"] etc.
  const bestMoveSan = await getBestMove(fen.value, legalMoves, history.value);

  if (bestMoveSan) {
    const result = makeMove(bestMoveSan); // chess.js .move() accepts SAN
    if (result) {
      lastMove.value = { from: result.from, to: result.to };
    }
  }
};

const handleReset = () => {
  resetGame();
  lastMove.value = null;
  aiThought.value = "";
  aiTaunt.value = "";
};

</script>

<template>
  <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
    
    <header class="w-full max-w-6xl flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <h1 class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
          Chess w/ Gemini
        </h1>
        <span class="px-3 py-1 rounded-full text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700">
          Model: Pro
        </span>
      </div>
      
      <button 
        @click="handleReset"
        class="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700 flex items-center gap-2"
      >
        <span>Reset Game</span>
      </button>
    </header>

    <main class="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left: Game Board -->
      <div class="lg:col-span-2 flex justify-center items-start">
        <div class="relative">
          <ChessBoard 
            :board="board" 
            :turn="turn" 
            :last-move="lastMove"
            :legal-moves="getLegalMovesSAN()"
            :get-legal-moves="getLegalMoves"
            @move="handleUserMove"
          />

          <!-- Game Over Overlay -->
          <div v-if="isGameOver" class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-sm">
            <div class="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl text-center transform scale-110">
              <h2 class="text-3xl font-bold text-white mb-2">
                {{ isCheckmate ? (turn === 'w' ? 'Black Wins!' : 'White Wins!') : 'Draw!' }}
              </h2>
              <p class="text-gray-400 mb-6">
                {{ isCheckmate ? 'Checkmate' : 'Stalemate / Draw' }}
              </p>
              <button @click="handleReset" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all">
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: AI Interaction Panel -->
      <div class="flex flex-col gap-6 h-[600px]">
        
        <!-- Status Card -->
        <div class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-400 uppercase text-xs font-bold tracking-wider">Opponent</h3>
            <span class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="isThinking ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'"></div>
              <span class="text-sm font-medium text-white">Gemini Pro</span>
            </span>
          </div>
          
          <div v-if="isThinking" class="flex flex-col items-center justify-center py-8 space-y-3">
             <span class="material-symbols-outlined text-5xl animate-gemini bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 pb-2 selection:bg-none select-none">
               magic_button
             </span>
             <p class="text-gray-300 text-sm animate-pulse">Gemini đang tính nước cờ...</p>
          </div>

          <div v-else class="space-y-4">
            <div v-if="aiTaunt" class="bg-gray-900/50 p-4 rounded-xl border-l-4 border-purple-500">
               <p class="text-purple-300 italic text-sm">"{{ aiTaunt }}"</p>
            </div>
            
            <div v-if="aiThought" class="bg-gray-900/50 p-4 rounded-xl border-l-4 border-blue-500">
              <h4 class="text-blue-400 text-xs font-bold mb-1 uppercase">Analysis</h4>
              <p class="text-gray-300 text-sm leading-relaxed">{{ aiThought }}</p>
            </div>

            <div v-if="!aiThought && !aiTaunt" class="text-center py-8 text-gray-500 text-sm">
               Make your move to start the game.
            </div>
          </div>
        </div>

        <!-- History / Details (Optional) -->
        <div class="flex-1 bg-gray-800/30 rounded-2xl p-6 border border-gray-700/30 overflow-hidden flex flex-col">
           <h3 class="text-gray-400 uppercase text-xs font-bold tracking-wider mb-4">Move History</h3>
           <div class="overflow-y-auto flex-1 pr-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
              <div v-for="(move, idx) in history" :key="idx" class="flex text-sm border-b border-gray-800 py-1">
                 <span class="w-8 text-gray-500">{{ Math.floor(idx / 2) + 1 }}.</span>
                 <span :class="idx % 2 === 0 ? 'text-white' : 'text-gray-400'">{{ move }}</span>
              </div>
           </div>
        </div>

        <div v-if="aiError" class="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {{ aiError }}
        </div>

      </div>
    </main>
  </div>
</template>

<style>
/* Custom Scrollbar for history */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #374151;
  border-radius: 20px;
}

/* Gemini Shimmer Animation */
.animate-gemini {
  background-size: 200% 200%;
  animation: gradient-move 3s infinite linear;
  display: inline-block;
}

@keyframes gradient-move {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
