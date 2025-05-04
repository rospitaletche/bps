/* ========================================================================== */
/* Archivo: frontend/src/components/PdfDropzone.jsx                          */
/* ========================================================================== */

import React, { useState, useCallback } from 'react';

/**
 * Área para subir archivos PDF mediante drag & drop o selección.
 * @param {object} props - Propiedades
 */
function PdfDropzone({ onFilesAccepted }) {
  const [highlight, setHighlight] = useState(false);
  const [acceptedFiles, setAcceptedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);

  // Funciones para drag & drop y selección
  const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e) => { preventDefaults(e); setHighlight(true); };
  const handleDragOver = (e) => { preventDefaults(e); setHighlight(true); };
  const handleDragLeave = (e) => { preventDefaults(e); setHighlight(false); };

  const processFiles = useCallback((files) => {
    const pdfFiles = [], nonPdfFiles = [];
    Array.from(files).forEach(file => {
      if (file.type === "application/pdf") pdfFiles.push(file);
      else nonPdfFiles.push(file);
    });
    setAcceptedFiles(pdfFiles);
    setRejectedFiles(nonPdfFiles);
    if (pdfFiles.length > 0) onFilesAccepted(pdfFiles);
  }, [onFilesAccepted]);

  const handleDrop = useCallback((e) => {
    preventDefaults(e);
    setHighlight(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
  };

  // Estilos del área de drop usando colores/opacidad de config (v3)
  const baseDropAreaStyle = "border-2 border-dashed rounded-lg p-5 text-center transition-all duration-300 cursor-pointer";
  const dropAreaStyle = `${baseDropAreaStyle} ${highlight ? 'border-secondary bg-primary bg-opacity-20' : 'border-primary bg-primary bg-opacity-10'}`;

  return (
    <div
      id="drop-area"
      className={dropAreaStyle}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {/* Icono PDF */}
      <i className="fas fa-file-pdf text-5xl text-primary mb-3"></i>
      <p className="mb-2 text-gray-700">Arrastra y suelta tu archivo PDF aquí</p>
      <p className="text-sm text-gray-500 mb-3">o</p>
      {/* Botón simulado */}
      <label className="inline-block bg-primary text-white px-4 py-2 rounded cursor-pointer hover:bg-secondary transition duration-150 ease-in-out font-medium shadow">
        Seleccionar Archivo
        <input type="file" id="file-input" multiple accept=".pdf" className="hidden" onChange={handleFileSelect} />
      </label>
      {/* Lista de archivos */}
      <div id="file-list" className="mt-4 text-left text-sm">
        {acceptedFiles.map((file, i) => (
          <div key={i} className="flex items-center py-1 text-gray-800">
            <i className="fas fa-file-pdf text-primary mr-2"></i><span>{file.name}</span>
          </div>
        ))}
        {rejectedFiles.map((file, i) => (
          <div key={`rejected-${i}`} className="flex items-center py-1 text-red-600">
            <i className="fas fa-exclamation-triangle mr-2"></i><span>{file.name} (Formato no soportado - solo PDF)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default PdfDropzone;