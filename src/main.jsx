/* ========================================================================== */
/* Archivo: frontend/src/main.jsx (ACTUALIZADO CON ROUTER)                   */
/* ========================================================================== */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom'; // Importar BrowserRouter
import { store } from './store/store.js';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* Envolver App con BrowserRouter */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);