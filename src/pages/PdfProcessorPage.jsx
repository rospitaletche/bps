/* ========================================================================== */
/* Archivo: frontend/src/pages/PdfProcessorPage.jsx (CORREGIDO NOMBRES JSON) */
/* ========================================================================== */

import React, { useState, useCallback } from 'react';
import { analyzePdfApi, createExpedienteApi } from '../services/apiService.js';
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
  // --- Estados ---
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null); // Se inicializa a null
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

  const handleProcessClick = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      setProcessingError("Por favor, seleccione o arrastre un archivo PDF.");
      return;
    }
    const fileToUpload = uploadedFiles[0];
    setIsProcessing(true); setProcessingComplete(false); setShowResults(false); setResultsData(null); setProcessingError(null);

    const { data, error } = await analyzePdfApi(fileToUpload);

    setIsProcessing(false);

    if (error) {
      console.error("Error al analizar el PDF:", error);
      setProcessingError(`Error al analizar: ${error}`);
      setShowResults(false);
    } else {
      // Validar y asegurar estructura mínima incluso si la API devuelve nulls
      const validatedData = {
          codigo_juzgado: data?.codigo_juzgado ?? null,
          nombre_juzgado: data?.nombre_juzgado ?? null,
          email_juzgado: data?.email_juzgado ?? null,
          departamento_juzgado: data?.departamento_juzgado ?? null,
          documentos_involucrados: Array.isArray(data?.documentos_involucrados) ? data.documentos_involucrados : [],
          asunto_principal: data?.asunto_principal ?? '',
          acciones_detalladas: Array.isArray(data?.acciones_detalladas) ? data.acciones_detalladas : [],
          cve: data?.cve ?? null,
          releva_secreto_tributario: data?.releva_secreto_tributario ?? false,
          justificacion_releva_secreto: data?.justificacion_releva_secreto ?? null,
      };
      setResultsData(validatedData);
      setShowResults(true);
      setProcessingComplete(true);
      setTimeout(() => setProcessingComplete(false), 2000);
    }
  }, [uploadedFiles]); // Dependencia correcta

  const handleSaveClick = useCallback(async () => {
    const numeroExpedienteCompleto = `2025-28-1-${expedienteNumber}`;
    if (!expedienteNumber.trim()) { setSaveError("Por favor, ingrese un número de expediente."); return; }
    const payload = { expediente_nro: numeroExpedienteCompleto, trabajado: false, id_usuario: 1 };
    setIsSaving(true); setSaveComplete(false); setSaveError(null);
    const { data, error } = await createExpedienteApi(payload);
    setIsSaving(false);
    if (error) { console.error("Error al guardar el expediente:", error); setSaveError(`Error al guardar: ${error}`); }
    else { console.log("Expediente guardado:", data); setSaveComplete(true); setTimeout(() => setSaveComplete(false), 1500); }
  }, [expedienteNumber]);

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
           {showResults && resultsData && ( // Asegurarse que resultsData no sea null
             <SectionCard title="Resultados del Análisis" id="results-section">

                {/* Juzgado Info */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-semibold text-secondary mb-2">Información del Juzgado</h3>
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Nombre:</span> {resultsData.nombre_juzgado || 'No identificado'}
                    </p>
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Departamento:</span> {resultsData.departamento_juzgado || 'No identificado'}
                    </p>
                    {resultsData.email_juzgado && (
                        <div className="mt-2">
                           {/* CORREGIDO: Pasar label=null explícitamente si no se quiere */}
                           <ResultItem label={null} value={resultsData.email_juzgado} id="email-juzgado" />
                        </div>
                    )}
                </div>

                {/* Asunto Principal - Usar nuevo nombre de campo */}
                <ResultItem label="Asunto Principal" value={resultsData.asunto_principal || 'No identificado'} id="asunto-principal" />

                {/* Documentos Involucrados - Usar nuevo nombre de campo */}
                <div className="mb-4">
                   <div className="font-medium text-secondary mb-2">Documentos Involucrados (C.I.)</div>
                   {/* Usar resultsData.documentos_involucrados */}
                   {resultsData.documentos_involucrados.length > 0 ? (
                       resultsData.documentos_involucrados.map((doc, index) => (
                           // CORREGIDO: Pasar label=null explícitamente
                           <ResultItem key={`doc-${index}`} label={null} value={doc} id={`doc-involucrado-${index}`} />
                       ))
                   ) : (
                       <p className="text-sm text-gray-500 italic">No se identificaron documentos principales.</p>
                   )}
                </div>

                {/* Acciones Detalladas - Usar nuevo nombre de campo */}
                <div className="mb-4">
                   <div className="font-medium text-secondary mb-2">Acciones Detalladas</div>
                   {/* Usar resultsData.acciones_detalladas */}
                   {resultsData.acciones_detalladas.length > 0 ? (
                       <div className="space-y-3">
                           {resultsData.acciones_detalladas.map((accion, index) => (
                               <div key={`accion-${index}`} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                   <p className="text-sm font-semibold text-primary mb-1">{accion.tipo_accion || 'Acción sin tipo'}</p>
                                   <p className="text-sm text-gray-800 mb-2">{accion.descripcion_completa || 'Sin descripción.'}</p>
                                   {Array.isArray(accion.involucrados_accion) && accion.involucrados_accion.length > 0 && (
                                       <div>
                                           <p className="text-xs font-medium text-gray-600 mb-1">Involucrados en esta acción:</p>
                                           <ul className="list-disc list-inside pl-2 space-y-1">
                                               {accion.involucrados_accion.map((inv, invIndex) => (
                                                   <li key={`inv-${index}-${invIndex}`} className="text-xs text-gray-600">
                                                       {inv.rol && <span className="font-medium">{inv.rol}:</span>} {inv.nombre_completo || 'Nombre no identificado'} {inv.documento_identidad && `(C.I. ${inv.documento_identidad})`}
                                                   </li>
                                               ))}
                                           </ul>
                                       </div>
                                   )}
                               </div>
                           ))}
                       </div>
                   ) : (
                       <p className="text-sm text-gray-500 italic">No se identificaron acciones específicas.</p>
                   )}
                </div>

                {/* CVE Link */}
                {resultsData.cve && (
                    <div className="mb-4">
                        <div className="font-medium text-secondary mb-2">Código de Verificación (CVE)</div>
                        <a
                            href={`https://validaciones.poderjudicial.gub.uy/?cve=${resultsData.cve}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:text-secondary hover:underline text-sm"
                        >
                            {resultsData.cve}
                            <i className="fas fa-external-link-alt text-xs ml-2"></i>
                        </a>
                    </div>
                )}

                {/* Secreto Tributario */}
                <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: resultsData.releva_secreto_tributario ? '#fef2f2' : '#f0fdf4', borderColor: resultsData.releva_secreto_tributario ? '#fecaca' : '#bbf7d0', borderWidth: '1px' }}>
                    <div className="font-medium text-secondary mb-2">Releva Secreto Tributario</div>
                    <p className={`text-sm font-semibold ${resultsData.releva_secreto_tributario ? 'text-red-700' : 'text-green-700'}`}>
                        {resultsData.releva_secreto_tributario ? 'Sí' : 'No'}
                    </p>
                    {resultsData.releva_secreto_tributario && resultsData.justificacion_releva_secreto && (
                        <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Justificación:</p>
                            <p className="text-xs text-gray-700 italic">"{resultsData.justificacion_releva_secreto}"</p>
                        </div>
                    )}
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
