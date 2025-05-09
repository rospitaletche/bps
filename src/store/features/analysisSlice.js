/* ========================================================================== */
/* Archivo: frontend/src/store/features/analysisSlice.js (NUEVO)             */
/* ========================================================================== */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  analysisData: null, // Aquí se guardarán los resultados del análisis del PDF
};

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Acción para guardar los datos del análisis
    setAnalysisData: (state, action) => {
      state.analysisData = action.payload;
    },
    // Acción para limpiar los datos del análisis
    clearAnalysisData: (state) => {
      state.analysisData = null;
    },
  },
});

// Exportar las acciones
export const { setAnalysisData, clearAnalysisData } = analysisSlice.actions;

// Exportar el reducer
export default analysisSlice.reducer;