/* ========================================================================== */
/* Archivo: frontend/src/App.jsx (ACTUALIZADO CON ROUTER)                    */
/* ========================================================================== */

import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Importar Routes y Route
import Header from './layouts/Header.jsx'; // Importar Header
import Footer from './layouts/Footer.jsx'; // Importar Footer
import PdfProcessorPage from './pages/PdfProcessorPage.jsx'; // Página "Front"
import BackPage from './pages/BackPage.jsx'; // Página "Back" (Placeholder)

/**
 * Componente raíz de la aplicación con enrutamiento.
 */
function App() {
  return (
    // Usar flex-col y min-h-screen aquí para asegurar que el footer quede abajo en todas las páginas
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header /> {/* Header se muestra en todas las rutas */}
      {/* Definir las rutas */}
      <Routes>
        {/* Ruta para la página principal (Procesador PDF) */}
        <Route path="/" element={<PdfProcessorPage />} />
        {/* Ruta para la página "Back" */}
        <Route path="/back" element={<BackPage />} />
        {/* Puedes añadir más rutas aquí */}
        {/* <Route path="/otra-pagina" element={<OtraPagina />} /> */}
        {/* Ruta comodín para páginas no encontradas (opcional) */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
      <Footer /> {/* Footer se muestra en todas las rutas */}
    </div>
  );
}
export default App;