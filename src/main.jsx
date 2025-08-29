/* ========================================================================== */
/* Archivo: frontend/src/main.jsx (ACTUALIZADO CON ROUTER)                   */
/* ========================================================================== */
import './polyfills/promise-with-resolvers'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
//import { BrowserRouter } from 'react-router-dom'; // Importar BrowserRouter
import { HashRouter } from 'react-router-dom'; // Usar HashRouter para compatibilidad con GitHub Pages                    
import { store } from './store/store.js';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* Envolver App con BrowserRouter */}
      {/* Usar HashRouter */}
      <HashRouter> {/* <-- CAMBIAR AQUÍ */}
        <App />
      </HashRouter>
    </Provider>
  </React.StrictMode>,
);