/* ========================================================================== */
/* Archivo: frontend/src/store/store.js (ACTUALIZADO)                        */
/* ========================================================================== */
import { configureStore } from '@reduxjs/toolkit';
// Importar el nuevo reducer del análisis
import analysisReducer from './features/analysisSlice.js';

export const store = configureStore({
  reducer: {
    // Añadir el reducer del análisis al store
    analysis: analysisReducer,
    // Otros reducers irían aquí si los tuvieras
  },
});