// frontend/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
// Importa tus reducers/slices aquí, por ejemplo:
//import counterReducer from './features/counter/counterSlice.js'; // <-- Asegúrate de importar tus reducers

export const store = configureStore({
  reducer: {
    // Añade tus reducers aquí
    //counter: counterReducer, // <-- Registra el reducer importado
  },
});

// No necesitas exportar tipos RootState/AppDispatch en JS de la misma forma que en TS
