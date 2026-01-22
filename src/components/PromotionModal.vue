<script setup lang="ts">
defineProps<{
  color: 'w' | 'b';
}>();

const emit = defineEmits(['select']);

const pieces = [
  { type: 'q', name: 'Queen' },
  { type: 'r', name: 'Rook' },
  { type: 'b', name: 'Bishop' },
  { type: 'n', name: 'Knight' }
];

const getPieceImage = (type: string, color: string) => {
  return `/${color}${type.toUpperCase()}.svg`;
};
</script>

<template>
  <div class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-sm">
    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl text-center transform scale-110">
      <h3 class="text-xl font-bold text-white mb-4">Choose Promotion</h3>
      <div class="flex gap-4">
        <button 
          v-for="piece in pieces" 
          :key="piece.type"
          @click="emit('select', piece.type)"
          class="w-16 h-16 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all border border-gray-600 hover:border-emerald-500"
        >
          <img :src="getPieceImage(piece.type, color)" :alt="piece.name" class="w-full h-full drop-shadow-md" />
        </button>
      </div>
    </div>
  </div>
</template>
