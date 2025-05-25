/* ========================================================================== */
/* Archivo: frontend/src/pages/AccessLogsPage.jsx (NUEVO)                    */
/* ========================================================================== */
import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import SectionCard from '../components/SectionCard.jsx';
import { getAccessLogsApi } from '../services/apiService.js';

/**
 * Página para visualizar los logs de acceso.
 */
function AccessLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Podrías añadir paginación aquí si es necesario
  // const [currentPage, setCurrentPage] = useState(0);
  // const [limitPerPage] = useState(50); // O el límite que prefieras

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    // const { data, error: fetchError } = await getAccessLogsApi(currentPage * limitPerPage, limitPerPage);
    const { data, error: fetchError } = await getAccessLogsApi(0, 200); // Cargar hasta 200 logs por ahora
    if (fetchError) {
      setError(fetchError);
    } else {
      setLogs(data);
    }
    setLoading(false);
  }, []); // Podrías añadir currentPage y limitPerPage como dependencias si implementas paginación

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = parseISO(timestamp);
      return isValid(date) ? format(date, "dd/MM/yyyy HH:mm:ss", { locale: es }) : "Fecha inválida";
    } catch (e) {
      return "Error fecha";
    }
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Registros de Acceso y Acciones">
        {loading && (
          <div className="text-center py-4">
            <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
            <p className="mt-2 text-gray-600">Cargando logs...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-4 text-red-600 bg-red-100 p-3 rounded-md">
            Error al cargar logs: {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(log.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">{log.action_description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user_identifier}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address || 'N/A (Backend)'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <pre className="whitespace-pre-wrap break-all">{log.details ? JSON.stringify(log.details, null, 2) : '-'}</pre>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay logs para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Aquí podrías añadir botones de paginación si es necesario */}
      </SectionCard>
    </main>
  );
}

export default AccessLogsPage;
