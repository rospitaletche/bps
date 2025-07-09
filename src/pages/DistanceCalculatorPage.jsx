/* ========================================================================== */
/* Archivo: frontend/src/pages/DistanceCalculatorPage.jsx (CORREGIDO)        */
/* ========================================================================== */
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import SectionCard from '../components/SectionCard.jsx';
import Button from '../components/Button.jsx';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils.js';
import { getDrivingDistanceViaBackend } from '../services/apiService.js';

function FileInputSection({ title, fileData, onFileChange }) {
  const { headers, latCol, lonCol, file } = fileData;

  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const newHeaders = result.meta.fields || [];
          const autoLat = newHeaders.find(h => h.toLowerCase().includes('lat')) || newHeaders.find(h => h.toLowerCase().includes('coord')) || newHeaders.find(h => h.toLowerCase().includes('wkt')) || newHeaders[0];
          const autoLon = newHeaders.find(h => h.toLowerCase().includes('lon')) || newHeaders.find(h => h.toLowerCase().includes('coord')) || newHeaders.find(h => h.toLowerCase().includes('wkt')) || newHeaders[1];
          onFileChange({ file: uploadedFile, headers: newHeaders, data: result.data, latCol: autoLat || '', lonCol: autoLon || '' });
        },
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false });

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 h-full flex flex-col">
      <h3 className="font-semibold text-secondary mb-3">{title}</h3>
      <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors flex-grow flex flex-col items-center justify-center ${isDragActive ? 'border-secondary bg-primary/20' : 'border-primary bg-primary/10'}`}>
        <input {...getInputProps()} />
        <i className="fas fa-file-csv text-4xl text-primary mb-2"></i>
        {file ? (<p className="text-sm text-gray-800">Archivo: <strong>{file.name}</strong></p>) : (<p className="text-sm text-gray-700">Arrastre o seleccione el archivo</p>)}
      </div>
      {headers.length > 0 && (
        <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Columna de Latitud</label>
                <select value={latCol} onChange={(e) => onFileChange({ ...fileData, latCol: e.target.value })} className="mt-1 block w-full text-sm px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Columna de Longitud</label>
                <select value={lonCol} onChange={(e) => onFileChange({ ...fileData, lonCol: e.target.value })} className="mt-1 block w-full text-sm px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">Nota: Si las coordenadas están en una sola columna, selecciónela en ambos menús.</p>
        </div>
      )}
    </div>
  );
}

function DistanceCalculatorPage() {
  const initialFileState = { file: null, headers: [], data: [], latCol: '', lonCol: '' };
  const [localesFile, setLocalesFile] = useState(initialFileState);
  const [puntosFile, setPuntosFile] = useState(initialFileState);
  const [distance, setDistance] = useState(25);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  
  const [isCalculatingGoogle, setIsCalculatingGoogle] = useState(false);
  const [googleApiResults, setGoogleApiResults] = useState([]);
  const [googleApiError, setGoogleApiError] = useState('');
  const [selectedGoogleRows, setSelectedGoogleRows] = useState(new Set());
  const [finalLocals, setFinalLocals] = useState({ cercanos: [], lejanos: [] }); // CORRECCIÓN: Estado declarado

  const getCoords = (row, latCol, lonCol) => {
    if (!row) return { lat: NaN, lng: NaN };
    const valueLat = row[latCol];
    
    if (typeof valueLat === 'string' && valueLat.toUpperCase().startsWith('POINT')) {
        const match = valueLat.match(/-?[\d\.]+/g);
        if (match && match.length >= 2) {
            const lng = parseFloat(match[0]);
            const lat = parseFloat(match[1]);
            return { lat, lng };
        }
    }
    if (latCol === lonCol) {
        const coords = String(valueLat || '').split(',');
        const lat = parseFloat(coords[0]?.trim());
        const lng = parseFloat(coords[1]?.trim());
        return { lat, lng };
    } else {
        const valueLon = row[lonCol];
        const lat = parseFloat(String(valueLat || '').replace(',', '.'));
        const lng = parseFloat(String(valueLon || '').replace(',', '.'));
        return { lat, lng };
    }
    return { lat: NaN, lng: NaN };
  };

  const handleCalculate = () => {
    setError('');
    setResults(null);
    setGoogleApiResults([]);
    setSelectedGoogleRows(new Set());
    setFinalLocals({ cercanos: [], lejanos: [] });
    if (!localesFile.file || !puntosFile.file || !localesFile.latCol || !localesFile.lonCol) {
      setError('Por favor, cargue ambos archivos y seleccione las columnas de coordenadas.');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const processedLocales = localesFile.data.map((local) => {
        const { lat: localLat, lng: localLng } = getCoords(local, localesFile.latCol, localesFile.lonCol);
        let minDistance = Infinity;
        let nearestPoint = null;
        if (!isNaN(localLat) && !isNaN(localLng)) {
          puntosFile.data.forEach((punto) => {
            const { lat: puntoLat, lng: puntoLng } = getCoords(punto, puntosFile.latCol, puntosFile.lonCol);
            if (!isNaN(puntoLat) && !isNaN(puntoLng)) {
              const d = getDistanceFromLatLonInKm(localLat, localLng, puntoLat, puntoLng);
              if (d < minDistance) {
                minDistance = d;
                nearestPoint = punto;
              }
            }
          });
        }
        return { ...local, minDistance, nearestPointInfo: nearestPoint };
      });
      const localesCercanos = processedLocales.filter(l => l.minDistance <= distance);
      const localesLejanos = processedLocales.filter(l => l.minDistance > distance);
      setResults({ cercanos: localesCercanos, lejanos: localesLejanos });
      setIsProcessing(false);
    }, 500);
  };
  
  const handleGoogleApiCalculate = async () => {
    if (!results || results.cercanos.length === 0) { setGoogleApiError("No hay locales cercanos para analizar. Realice primero el cálculo manual."); return; }
    
    setIsCalculatingGoogle(true);
    setGoogleApiError('');
    setGoogleApiResults([]);
    setSelectedGoogleRows(new Set());
    
    const localesToProcess = results.cercanos;
    const apiResults = [];

    for (const local of localesToProcess) {
      const originCoords = getCoords(local, localesFile.latCol, localesFile.lonCol);
      const destinationCoords = getCoords(local.nearestPointInfo, puntosFile.latCol, puntosFile.lonCol);

      if (isNaN(originCoords.lat) || isNaN(originCoords.lng) || isNaN(destinationCoords.lat) || isNaN(destinationCoords.lng)) {
        apiResults.push({ ...local, googleDistance: 'Error', googleDuration: 'Coordenadas inválidas' });
        continue;
      }

      const { data, error } = await getDrivingDistanceViaBackend(originCoords, destinationCoords);
      
      if(error) {
        apiResults.push({ ...local, googleDistance: 'Error Backend', googleDuration: error });
      } else {
        apiResults.push({ ...local, googleDistance: data.distance || 'Error', googleDuration: data.duration || '' });
      }
    }

    setGoogleApiResults(apiResults);
    
    const googleCercanos = apiResults.filter(res => {
        const distKm = parseFloat(res.googleDistance);
        return !isNaN(distKm) && distKm <= distance;
    });
    const googleCercanosNames = new Set(googleCercanos.map(l => l.name));
    const googleLejanos = localesFile.data.filter(l => !googleCercanosNames.has(l.name));
    setFinalLocals({ cercanos: googleCercanos, lejanos: googleLejanos });

    setIsCalculatingGoogle(false);
  };
  
  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const dataToExport = data.map(({minDistance, nearestPointInfo, googleDistance, googleDuration, ...rest}) => rest);
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSelectAllGoogle = (e) => {
      if (e.target.checked) {
          const allIds = new Set(googleApiResults.map(l => l.name || Object.values(l)[0]));
          setSelectedGoogleRows(allIds);
      } else {
          setSelectedGoogleRows(new Set());
      }
  };

  const handleSelectRowGoogle = (id) => {
      const newSelection = new Set(selectedGoogleRows);
      if (newSelection.has(id)) {
          newSelection.delete(id);
      } else {
          newSelection.add(id);
      }
      setSelectedGoogleRows(newSelection);
  };

  const isCalcButtonDisabled = isProcessing || !localesFile.file || !puntosFile.file;

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Calculadora de Distancias Geográficas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FileInputSection title="Archivo de Locales de Pago" fileData={localesFile} onFileChange={setLocalesFile} />
          <FileInputSection title="Archivo de Cajeros/Puntos de Interés" fileData={puntosFile} onFileChange={setPuntosFile} />
        </div>
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
            Distancia máxima para considerar "cercano" (en kilómetros)
          </label>
          <input type="number" id="distance" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
        </div>
        <div className="text-center">
          <Button onClick={handleCalculate} disabled={isCalcButtonDisabled}>
            {isProcessing ? <><i className="fas fa-spinner fa-spin mr-2"></i>Calculando...</> : <>Paso 1: Calcular Distancias Manualmente</>}
          </Button>
        </div>
        {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </SectionCard>

      {results && (
        <SectionCard title="Resultados del Análisis">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-secondary mb-2">Paso 1: Locales Cercanos (Cálculo Manual)</h3>
                <p className="text-sm text-gray-600 mb-4">Locales que se encuentran a {distance} km o menos (en línea recta) de un punto de interés. Total: {results.cercanos.length}</p>
                <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localización (Name)</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distancia Mínima (km)</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.cercanos.length > 0 ? results.cercanos.map((local, index) => (
                                <tr key={index}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{local.name || Object.values(local)[0]}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{local.minDistance.toFixed(2)}</td></tr>
                            )) : (<tr><td colSpan="2" className="px-6 py-4 text-center text-gray-500">No se encontraron locales cercanos.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="pt-6 border-t-2 border-dashed border-primary mt-6">
                <h3 className="text-lg font-semibold text-secondary mb-2">Paso 2: Calcular Distancias Exactas (vía Backend)</h3>
                <p className="text-sm text-gray-600 mb-4">Esto calculará la distancia de manejo para los {results.cercanos.length} locales cercanos encontrados.</p>
                <Button onClick={handleGoogleApiCalculate} disabled={isCalculatingGoogle || results.cercanos.length === 0}>
                    {isCalculatingGoogle ? <><i className="fas fa-spinner fa-spin mr-2"></i>Calculando...</> : <><i className="fab fa-google mr-2"></i>Calcular Distancias de Manejo</>}
                </Button>
                {googleApiError && <p className="mt-2 text-red-600 text-sm">{googleApiError}</p>}

                {googleApiResults.length > 0 && (
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 mb-2">Resultados de Google</h4>
                        <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-4 py-3 w-10"><input type="checkbox" onChange={handleSelectAllGoogle} checked={googleApiResults.length > 0 && selectedGoogleRows.size === googleApiResults.length} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"/></th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distancia Aérea</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distancia en Auto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo en Auto</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {googleApiResults.map((res, index) => {
                                        const id = res.name || Object.values(res)[0];
                                        return (
                                        <tr key={index}>
                                            <td className="px-4 py-4"><input type="checkbox" checked={selectedGoogleRows.has(id)} onChange={() => handleSelectRowGoogle(id)} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"/></td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{id}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{res.minDistance.toFixed(2)} km</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">{res.googleDistance}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{res.googleDuration}</td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4">
                            <Button onClick={() => downloadCSV(googleApiResults.filter(l => selectedGoogleRows.has(l.name || Object.values(l)[0])), 'locales_seleccionados_google.csv')} variant="primary" disabled={selectedGoogleRows.size === 0}>
                                <i className="fas fa-download mr-2"></i>Descargar Seleccionados ({selectedGoogleRows.size})
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {finalLocals.lejanos.length > 0 && (
                 <div className="pt-6 border-t-2 border-dashed border-green-500 mt-6">
                    <h3 className="text-lg font-semibold text-secondary mb-2">Paso 3: Exportación Final de Locales que NO Cumplen</h3>
                    <p className="text-sm text-gray-600 mb-4">Se han identificado {finalLocals.lejanos.length} locales que NO cumplen la condición de distancia de manejo de {distance} km.</p>
                    <Button onClick={() => downloadCSV(finalLocals.lejanos, 'locales_finales_no_cumplen.csv')} variant="secondary">
                        <i className="fas fa-download mr-2"></i>Descargar Lista Final de Locales que NO Cumplen
                    </Button>
                </div>
            )}
        </SectionCard>
      )}
    </main>
  );
}

export default DistanceCalculatorPage;