/* ========================================================================== */
/* Archivo: frontend/src/pages/PdfProcessorPage.jsx (REFACTORIZADO CON API SERVICE) */
/* ========================================================================== */

import React, { useState, useCallback } from 'react';
// Importar el servicio API
import { analyzePdfApi, createExpedienteApi } from '../services/apiService.js'; // Ajusta ruta si es necesario
// Importar componentes
import SectionCard from '../components/SectionCard.jsx';
import PdfDropzone from '../components/PdfDropzone.jsx';
import Button from '../components/Button.jsx';
import ResultItem from '../components/ResultItem.jsx';
import ExpedienteInput from '../components/ExpedienteInput.jsx';
import CheckboxWithNumber from '../components/CheckboxWithNumber.jsx';

/**
 * Página principal del procesador de PDF.
 */
function PdfProcessorPage() {
  // --- Estados (sin cambios) ---
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [expedienteNumber, setExpedienteNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [predefinedTextChecked, setPredefinedTextChecked] = useState(false);
  const [predefinedTextNumber, setPredefinedTextNumber] = useState(2);
  const [currentPredefinedText, setCurrentPredefinedText] = useState(
    'La documentación contenida en foja 1, concuerda con el original que se tuvo a la vista.'
  );

  // --- Handlers ---
  const handleFilesAccepted = useCallback((files) => {
    setUploadedFiles(files);
    setShowResults(false);
    setResultsData(null);
    setProcessingComplete(false);
    setProcessingError(null);
  }, []);

  // --- Lógica para llamar al API de Análisis usando el servicio ---
  const handleProcessClick = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      setProcessingError("Por favor, seleccione o arrastre un archivo PDF.");
      return;
    }
    const fileToUpload = uploadedFiles[0];
    setIsProcessing(true);
    setProcessingComplete(false);
    setShowResults(false);
    setResultsData(null);
    setProcessingError(null);

    // Llamar a la función del servicio
    const { data, error } = await analyzePdfApi(fileToUpload);

    setIsProcessing(false); // Terminar estado de carga

    if (error) {
      console.error("Error al analizar el PDF:", error);
      setProcessingError(`Error al analizar: ${error}`);
      setShowResults(false);
    } else {
      setResultsData(data);
      setShowResults(true);
      setProcessingComplete(true);
      // Resetear estado visual de completado después de un tiempo
      setTimeout(() => setProcessingComplete(false), 2000);
    }
  }, [uploadedFiles]); // Depende solo de los archivos

  // --- Lógica para Guardar Expediente usando el servicio ---
  const handleSaveClick = useCallback(async () => {
    const numeroExpedienteCompleto = `2025-28-1-${expedienteNumber}`;

    if (!expedienteNumber.trim()) {
      setSaveError("Por favor, ingrese un número de expediente.");
      return;
    }

    const payload = {
      expediente_nro: numeroExpedienteCompleto,
      trabajado: false,
      id_usuario: 1
    };

    setIsSaving(true);
    setSaveComplete(false);
    setSaveError(null);

    // Llamar a la función del servicio
    const { data, error } = await createExpedienteApi(payload);

    setIsSaving(false); // Terminar estado de carga

    if (error) {
      console.error("Error al guardar el expediente:", error);
      setSaveError(`Error al guardar: ${error}`);
    } else {
      console.log("Expediente guardado:", data);
      setSaveComplete(true);
      // Resetear estado visual de completado después de un tiempo
      setTimeout(() => setSaveComplete(false), 1500);
      // setExpedienteNumber(''); // Opcional: limpiar campo
    }
  }, [expedienteNumber]); // Depende solo del número

  // --- Handlers para Texto Predefinido (sin cambios) ---
  const updatePredefinedText = useCallback((checked, number) => {
    let text = '';
    if (checked) text = `La documentación contenida en fojas 1 a ${number}, concuerda con los originales que se tuvieron a la vista.`;
    else text = 'La documentación contenida en foja 1, concuerda con el original que se tuvo a la vista.';
    setCurrentPredefinedText(text);
  }, []);
  const handleCheckboxChange = useCallback((e) => { const isChecked = e.target.checked; setPredefinedTextChecked(isChecked); updatePredefinedText(isChecked, predefinedTextNumber); }, [predefinedTextNumber, updatePredefinedText]);
  const handleNumberChange = useCallback((e) => { const newNumber = parseInt(e.target.value, 10) || 1; setPredefinedTextNumber(newNumber); if (predefinedTextChecked) updatePredefinedText(predefinedTextChecked, newNumber); }, [predefinedTextChecked, updatePredefinedText]);

  // --- Renderizado ---
  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Cargar PDF" id="upload-section">
        <PdfDropzone onFilesAccepted={handleFilesAccepted} />
        {processingError && (<div className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{processingError}</div>)}
        <div className="flex justify-center mt-4">
          <Button onClick={handleProcessClick} disabled={isProcessing || uploadedFiles.length === 0} variant="primary">
            {isProcessing ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Analizando...</>) : processingComplete ? (<><i className="fas fa-check mr-2"></i>Analizado</>) : (<><i className="fas fa-cogs mr-2"></i>Analizar</>)}
          </Button>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6">
        {/* Columna 1: Resultados */}
        <div className={showResults && resultsData && !processingError ? 'block' : 'hidden md:block md:invisible'}>
           {showResults && resultsData && (
             <SectionCard title="Resultados" id="results-section">
               <ResultItem label="Código" value={resultsData.codigo || ''} id="codigo" />
               <div className="mb-4">
                 <div className="font-medium text-secondary mb-2">Documento(s)</div>
                 {Array.isArray(resultsData.documentos) ? resultsData.documentos.map((doc, index) => (<ResultItem key={index} value={doc || ''} id={`documento-${index}`} />)) : <ResultItem value="N/A" id="documento-0" />}
               </div>
               <ResultItem label="Asunto" value={resultsData.asunto || ''} id="asunto" />
               <div className="mb-4">
                 <div className="font-medium text-secondary mb-2">Acciones</div>
                 <div className="space-y-2">
                   {Array.isArray(resultsData.acciones) ? resultsData.acciones.map((accion, index) => (<div key={index} className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700">{accion || ''}</div>)) : <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700">N/A</div>}
                 </div>
               </div>
             </SectionCard>
           )}
        </div>

        {/* Columna 2: Expediente */}
        <div>
          <SectionCard title="Expediente">
            {/* Input de Expediente */}
            <ExpedienteInput
                id="expediente"
                label="Número de Expediente"
                prefix="2025-28-1-"
                placeholder="123456"
                value={expedienteNumber}
                onChange={(e) => { setExpedienteNumber(e.target.value); setSaveError(null); }} // Limpiar error al escribir
            />
            {/* Botón Guardar (Movido aquí) */}
            <div className="mt-2 mb-4"> {/* Ajustar margen */}
              <Button onClick={handleSaveClick} disabled={isSaving} variant="primary">
                {isSaving ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</>) : saveComplete ? (<><i className="fas fa-check mr-2"></i>Guardado!</>) : (<><i className="fas fa-save mr-2"></i>Guardar</>)}
              </Button>
              {/* Mostrar error de guardado si existe */}
              {saveError && (
                  <p className="mt-2 text-sm text-red-600">{saveError}</p>
              )}
            </div>

            {/* Sección Texto Predefinido */}
            <div className="pt-4 border-t border-gray-200"> {/* Separador */}
              <div className="font-medium text-gray-700 mb-3">Texto para el APIA</div>
              <CheckboxWithNumber
                id="text-option"
                checked={predefinedTextChecked}
                onCheckboxChange={handleCheckboxChange}
                numberValue={predefinedTextNumber}
                onNumberChange={handleNumberChange}
                labelPrefix="Paginas"
              />
              <ResultItem value={currentPredefinedText} id="predefined-text" />
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
export default PdfProcessorPage;