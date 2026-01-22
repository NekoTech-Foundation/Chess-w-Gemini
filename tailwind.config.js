/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'board-light': '#eeeed2',
                'board-dark': '#769656',
                'board-highlight': '#baca44',
            },
            gridTemplateRows: {
                '8': 'repeat(8, minmax(0, 1fr))',
            }
        },
    },
    plugins: [],
}
