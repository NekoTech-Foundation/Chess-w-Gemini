<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const hasSavedGame = ref(false);

onMounted(() => {
  const savedGame = localStorage.getItem('chess_game_state');
  if (savedGame) {
    hasSavedGame.value = true;
  }
});

const startNewGame = () => {
  // Generate a random ID for the new game
  const newGameId = crypto.randomUUID();
  // Clear any existing game state if necessary, or just overwrite on load
  // For now, we just navigate to the new ID
  router.push(`/game/${newGameId}`);
};

const continueGame = () => {
  const savedGame = localStorage.getItem('chess_game_state');
  if (savedGame) {
    try {
        const parsed = JSON.parse(savedGame);
        // If we saved the ID, we could use it. If not, we might default to 'resume' or similar.
        // For simplicity, let's assume we store the ID or just redirect to a generic active route
        // logic.
        // Ideally, the saved game state should contain the ID.
        if (parsed.id) {
            router.push(`/game/${parsed.id}`);
        } else {
            // Fallback if no ID in state
             router.push(`/game/resume`);
        }
    } catch (e) {
        console.error("Failed to parse saved game", e);
        startNewGame();
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
    <div class="max-w-md w-full text-center space-y-8">
      
      <div class="space-y-2">
        <h1 class="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 pb-2">
          Elemental Chess
        </h1>
        <p class="text-gray-400 text-lg">Powered by Gemini AI</p>
      </div>

      <div class="space-y-4 flex flex-col items-center">
        
        <button 
          @click="startNewGame"
          class="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xl shadow-lg hover:shadow-cyan-500/20 transition-all transform hover:-translate-y-1 relative group overflow-hidden"
        >
          <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span class="relative flex items-center justify-center gap-3">
            <span class="material-symbols-outlined">swords</span>
            Start New Game
          </span>
        </button>

        <button 
          v-if="hasSavedGame"
          @click="continueGame"
          class="w-full py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xl border border-gray-700 shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 group"
        >
          <span class="material-symbols-outlined text-emerald-400 group-hover:scale-110 transition-transform">resume</span>
          Continue Session
        </button>

      </div>
      
      <p class="text-gray-600 text-sm">
        v1.0.0 &bull; Local Storage Enabled
      </p>

    </div>
  </div>
</template>
