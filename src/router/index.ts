import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import GameView from '../views/GameView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/game/:id',
            name: 'game',
            component: GameView
        }
    ]
});

// Navigation Guard to redirect if reloading a game page (Already handled by localStorage logic in HomeView/GameView somewhat, 
// but we can add more robustness here later if needed).
// For now, simple routing is enough.

export default router;
