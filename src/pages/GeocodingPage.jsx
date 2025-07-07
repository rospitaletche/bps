/* ========================================================================== */
/* Archivo: frontend/src/pages/GeocodingPage.jsx (CORREGIDO Y MEJORADO)      */
/* ========================================================================== */
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import SectionCard from '../components/SectionCard.jsx';
import Button from '../components/Button.jsx';
import { geocodeAddress } from '../services/googleMapsService.js';

// Nota para el desarrollador: Asegúrate de instalar papaparse
// npm install papaparse

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function GeocodingPage() {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [results, setResults] = useState([]);
  const [dataForDownload, setDataForDownload] = useState([]);

  const onDrop = (acceptedFiles) => {
    // Resetear estados al subir un nuevo archivo
    setFile(null);
    setError(null);
    setResults([]);
    setCsvHeaders([]);
    setParsedData([]);
    setSelectedColumn('');
    setDataForDownload([]);
    setIsProcessing(false);
    setProgress({ current: 0, total: 0 });

    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length) {
            setError(`Error al analizar el archivo CSV: ${result.errors[0].message}`);
            setFile(null);
            return;
          }
          const headers = result.meta.fields;
          if (!headers || headers.length === 0) {
            setError('No se pudieron detectar encabezados en el archivo CSV. Asegúrese de que la primera línea los contenga.');
            setFile(null);
            return;
          }
          setCsvHeaders(headers);
          setParsedData(result.data);
          
          // LÓGICA MEJORADA: Auto-seleccionar la 4ta columna (índice 3) si existe, sino la primera.
          if (headers.length >= 4) {
            setSelectedColumn(headers[3]); 
          } else {
            setSelectedColumn(headers[0]);
          }
        },
        error: (err) => {
          setError(`Error al leer el archivo: ${err.message}`);
          setFile(null);
        }
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleGeocode = async () => {
    if (!apiKey.trim()) { setError('Por favor, ingrese su clave de API de Google Maps.'); return; }
    if (parsedData.length === 0) { setError('Por favor, cargue un archivo CSV válido.'); return; }
    if (!selectedColumn) { setError('Por favor, seleccione la columna que contiene las direcciones.'); return; }

    const addressesToProcess = parsedData.map(row => row[selectedColumn]).filter(Boolean);
    if (addressesToProcess.length === 0) { setError('La columna seleccionada no contiene direcciones válidas.'); return; }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    const geocodedResultsForPreview = [];
    const fullDataForDownload = [];
    setProgress({ current: 0, total: parsedData.length });

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const address = row[selectedColumn];
      let geocodingResult = { status: 'SKIPPED', error: 'Dirección vacía en la fila' };

      if (address) {
        geocodingResult = await geocodeAddress(address, apiKey);
        await sleep(50);
      }

      geocodedResultsForPreview.push({ original: address || 'N/A', ...geocodingResult });
      fullDataForDownload.push({
        ...row,
        latitud_geocodificada: geocodingResult.lat || '',
        longitud_geocodificada: geocodingResult.lng || '',
        direccion_formateada_google: geocodingResult.formatted_address || '',
        estado_geocodificacion: geocodingResult.status,
      });
      
      setProgress({ current: i + 1, total: parsedData.length });
    }
    
    setResults(geocodedResultsForPreview);
    setDataForDownload(fullDataForDownload);
    setIsProcessing(false);
  };

  const downloadCSV = () => {
    if (dataForDownload.length === 0) return;
    const csv = Papa.unparse(dataForDownload);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'coordenadas_geocodificadas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Herramienta de Geocodificación por Lotes">
        <p className="text-sm text-gray-600 mb-4">
          Suba un archivo CSV con direcciones para obtener sus coordenadas geográficas.
          Esta herramienta utiliza la API de Google Maps, por lo que necesitará su propia clave de API.
        </p>

        <div className="mb-6">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Clave de API de Google Maps
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Ingrese su clave de API aquí"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
          <a href="https://developers.google.com/maps/documentation/geocoding/get-api-key" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
            ¿Cómo obtener una clave de API?
          </a>
        </div>

        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-secondary bg-primary/20' : 'border-primary bg-primary/10'}`}>
          <input {...getInputProps()} />
          <i className="fas fa-file-csv text-5xl text-primary mb-3"></i>
          {file ? (
            <p className="text-gray-800">Archivo cargado: <strong>{file.name}</strong> ({parsedData.length} filas detectadas)</p>
          ) : (
            <p className="text-gray-700">Arrastre un archivo CSV aquí, o haga clic para seleccionar.</p>
          )}
        </div>

        {csvHeaders.length > 0 && (
          <div className="my-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <label htmlFor="column-select" className="block text-sm font-medium text-gray-700 mb-2">
              Seleccione la columna que contiene la dirección completa:
            </label>
            <select
              id="column-select"
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="" disabled>-- Seleccione una columna --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button onClick={handleGeocode} disabled={isProcessing || parsedData.length === 0 || !apiKey || !selectedColumn}>
            {isProcessing ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Geocodificando ({progress.current}/{progress.total})...</>
            ) : (
              <><i className="fas fa-globe-americas mr-2"></i>Geocodificar Direcciones</>
            )}
          </Button>
        </div>

        {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </SectionCard>

      {results.length > 0 && !isProcessing && (
        <SectionCard title="Resultados de Geocodificación">
          <div className="mb-4 text-center">
            <Button onClick={downloadCSV} variant="secondary">
              <i className="fas fa-download mr-2"></i>Descargar CSV Completo
            </Button>
          </div>
          <p className="text-xs text-center text-gray-500 mb-4">La tabla a continuación muestra una vista previa. El archivo descargado contendrá todas las columnas originales más los datos de geocodificación.</p>
          <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección Original</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitud</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitud</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className={result.status !== 'OK' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{result.original}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{result.lat || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{result.lng || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </main>
  );
}

export default GeocodingPage;

