/* ========================================================================== */
/* Archivo: frontend/tailwind.config.js (Tailwind v3)                        */
/* ========================================================================== */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: { // Colocar las personalizaciones dentro de extend
      colors: {
        // Definir los colores personalizados directamente aquí
        primary: '#4e8ecb',    // Azul primario del original
        secondary: '#193b69',   // Azul secundario/oscuro del original
      },
      fontFamily: {
        // Definir la fuente principal aquí
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      }
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // Ejemplo de plugin
  ],
}