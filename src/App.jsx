import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './layouts/Header.jsx';
import Footer from './layouts/Footer.jsx';
import PdfProcessorPage from './pages/PdfProcessorPage.jsx';
import BackPage from './pages/BackPage.jsx';
import CalculadoraPage from './pages/CalculadoraPage.jsx';
import GemelaresAutomaticoPage from './pages/GemelaresAutomaticoPage.jsx';
import AccessLogsPage from './pages/AccessLogsPage.jsx';
import GeocodingPage from './pages/GeocodingPage.jsx';
import DistanceCalculatorPage from './pages/DistanceCalculatorPage.jsx'; // Importar nueva página

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <Routes>
        <Route path="/" element={<PdfProcessorPage />} />
        <Route path="/back" element={<BackPage />} />
        <Route path="/calculadora-prestaciones" element={<CalculadoraPage />} />
        <Route path="/gemelares/automatico" element={<GemelaresAutomaticoPage />} />
        <Route path="/_debug/access-logs" element={<AccessLogsPage />} />
        <Route path="/analisis-geo/geocodificador" element={<GeocodingPage />} />
        {/* Nueva ruta para la calculadora de distancias */}
        <Route path="/analisis-geo/calculo-distancia" element={<DistanceCalculatorPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
export default App;