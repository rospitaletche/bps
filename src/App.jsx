/* ========================================================================== */
/* Archivo: frontend/src/App.jsx (ACTUALIZADO CON NUEVA RUTA OCULTA)         */
/* ========================================================================== */
/* (Sin cambios) */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './layouts/Header.jsx';
import Footer from './layouts/Footer.jsx';
import PdfProcessorPage from './pages/PdfProcessorPage.jsx';
import BackPage from './pages/BackPage.jsx';
import CalculadoraPage from './pages/CalculadoraPage.jsx';
import GemelaresAutomaticoPage from './pages/GemelaresAutomaticoPage.jsx';
import AccessLogsPage from './pages/AccessLogsPage.jsx';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <Routes>
        <Route path="/" element={<CalculadoraPage />} />
        <Route path="/back" element={<BackPage />} />
        <Route path="/calculadora-prestaciones" element={<CalculadoraPage />} />
        <Route path="/gemelares/automatico" element={<GemelaresAutomaticoPage />} />
        <Route path="/_debug/access-logs" element={<AccessLogsPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
export default App;