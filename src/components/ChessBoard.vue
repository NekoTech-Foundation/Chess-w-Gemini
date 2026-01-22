<script setup lang="ts">
import { ref } from 'vue';
import PromotionModal from './PromotionModal.vue';

// Props
const props = defineProps<{
  board: ( { square: string; type: string; color: string } | null )[][]; // chess.js board structure
  turn: string; // 'w' or 'b'
  lastMove: { from: string; to: string } | null;
  legalMoves: string[]; 
  getLegalMoves: (square: string) => any[]; 
}>();

const emit = defineEmits(['move']);

const selectedSquare = ref<string | null>(null);
const possibleDestinations = ref<string[]>([]);
const showPromotionModal = ref(false);
const pendingPromotionMove = ref<{ from: string, to: string } | null>(null);

const getPieceImage = (type: string, color: string) => {
  return `/${color}${type.toUpperCase()}.svg`;
};

const handleSquareClick = (square: string) => {
  // If modal is open, ignore clicks
  if (showPromotionModal.value) return;

  // If no square selected, select it if it has a piece of current turn
  if (!selectedSquare.value) {
    const piece = props.board.flat().find(s => s?.square === square);
    if (piece && piece.color === props.turn) {
      selectedSquare.value = square;
      const moves = props.getLegalMoves(square);
      possibleDestinations.value = moves.map(m => m.to);
    }
    return;
  }

  // If square selected
  if (selectedSquare.value === square) {
    // Clicked same square, deselect
    selectedSquare.value = null;
    possibleDestinations.value = [];
    return;
  }

  // Attempt move
  if (possibleDestinations.value.includes(square)) {
    const from = selectedSquare.value;
    const to = square;
    
    // Check for promotion
    const piece = props.board.flat().find(s => s?.square === from);
    const isPawn = piece?.type === 'p';
    const isPromotionRank = (piece?.color === 'w' && to[1] === '8') || (piece?.color === 'b' && to[1] === '1');

    if (isPawn && isPromotionRank) {
       pendingPromotionMove.value = { from, to };
       showPromotionModal.value = true;
       return;
    }

    emit('move', { from, to });
    selectedSquare.value = null;
    possibleDestinations.value = [];
  } else {
    // Clicked elsewhere
    // If clicked on another own piece, switch selection
    const piece = props.board.flat().find(s => s?.square === square);
    if (piece && piece.color === props.turn) {
      selectedSquare.value = square;
      const moves = props.getLegalMoves(square);
      possibleDestinations.value = moves.map(m => m.to);
    } else {
      selectedSquare.value = null;
      possibleDestinations.value = [];
    }
  }
};

const handlePromotionSelect = (type: string) => {
  if (pendingPromotionMove.value) {
    emit('move', { 
        from: pendingPromotionMove.value.from, 
        to: pendingPromotionMove.value.to, 
        promotion: type 
    });
    pendingPromotionMove.value = null;
    showPromotionModal.value = false;
    selectedSquare.value = null;
    possibleDestinations.value = [];
  }
};

// Utils for grid
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
</script>

<template>
  <div class="relative w-full max-w-[600px] aspect-square">
      <div class="grid grid-cols-8 grid-rows-8 w-full h-full border-4 border-[#333] shadow-2xl rounded-sm overflow-hidden select-none">
        <!-- Render squares -->
        <template v-for="(rank, rIdx) in RANKS" :key="rank">
          <div 
            v-for="(file, fIdx) in FILES" 
            :key="file + rank"
            class="relative flex items-center justify-center w-full h-full text-4xl"
            :class="[
              (rIdx + fIdx) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark',
              selectedSquare === file + rank ? '!bg-yellow-400/80' : '',
              possibleDestinations.includes(file + rank) ? 'cursor-pointer' : '',
              lastMove?.from === file + rank || lastMove?.to === file + rank ? 'bg-yellow-200/50' : ''
            ]"
            @click="handleSquareClick(file + rank)"
          >
            <!-- Rank/File Labels -->
            <span v-if="fIdx === 0" class="absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold" :class="(rIdx + fIdx) % 2 === 0 ? 'text-board-dark' : 'text-board-light'">
              {{ rank }}
            </span>
            <span v-if="rIdx === 7" class="absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold" :class="(rIdx + fIdx) % 2 === 0 ? 'text-board-dark' : 'text-board-light'">
              {{ file }}
            </span>

            <!-- Possible Move Indicator (Dot) -->
            <div v-if="possibleDestinations.includes(file + rank)" class="absolute w-1/3 h-1/3 rounded-full bg-black/20 z-10 pointer-events-none"></div>

            <!-- Piece -->
            <div v-if="board[rIdx][fIdx]" class="w-full h-full z-20 p-1 md:p-1.5 transition-transform duration-200 hover:scale-110">
               <img :src="getPieceImage(board[rIdx][fIdx].type, board[rIdx][fIdx].color)" class="w-full h-full drop-shadow-md select-none" draggable="false" />
            </div>
          </div>
        </template>
      </div>

      <!-- Promotion Modal Overlay -->
      <PromotionModal 
        v-if="showPromotionModal" 
        :color="turn as 'w' | 'b'" 
        @select="handlePromotionSelect" 
      />
  </div>
</template>

<style scoped>
/* No extra styles needed if Tailwind is set up correctly */
</style>
