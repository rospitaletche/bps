/* ========================================================================== */
/* Archivo: frontend/src/pages/BackPage.jsx (ACTUALIZADO - Lista Expedientes)*/
/* ========================================================================== */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SectionCard from '../components/SectionCard.jsx'; // Reutilizar SectionCard
import Button from '../components/Button.jsx'; // Para filtros
import { getExpedientesApi, updateTrabajadoStatusApi } from '../services/apiService.js'; // Importar funciones API

/**
 * Página para mostrar y gestionar la lista de expedientes.
 */
function BackPage() {
  const [expedientes, setExpedientes] = useState([]); // Lista completa de expedientes
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const [error, setError] = useState(null); // Estado de error al cargar
  const [filter, setFilter] = useState('todos'); // Filtro actual: 'todos', 'trabajados', 'no_trabajados'
  const [updatingStatus, setUpdatingStatus] = useState({}); // Estado para saber qué expediente se está actualizando { id: boolean }

  // Cargar expedientes al montar el componente
  const fetchExpedientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Llamar a la API para obtener los expedientes con un límite razonable
    const { data, error: fetchError } = await getExpedientesApi(0, 100); // CORREGIDO: Usar límite 100
    if (fetchError) {
      setError(fetchError);
    } else {
      setExpedientes(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExpedientes();
  }, [fetchExpedientes]); // Ejecutar al montar

  // Filtrar expedientes basado en el estado del filtro
  const filteredExpedientes = useMemo(() => {
    switch (filter) {
      case 'trabajados':
        return expedientes.filter(exp => exp.trabajado);
      case 'no_trabajados':
        return expedientes.filter(exp => !exp.trabajado);
      case 'todos':
      default:
        return expedientes;
    }
  }, [expedientes, filter]); // Recalcular solo si cambian expedientes o filtro

  // Manejar el cambio de estado 'trabajado'
  const handleToggleTrabajado = useCallback(async (expediente) => {
    const newStatus = !expediente.trabajado;
    setUpdatingStatus(prev => ({ ...prev, [expediente.id]: true })); // Marcar como actualizando
    setError(null); // Limpiar error previo

    const { data: updatedExpediente, error: updateError } = await updateTrabajadoStatusApi(expediente.id, newStatus);

    if (updateError) {
      // Mostrar error específico para esta acción si es posible
      setError(`Error al actualizar ID ${expediente.id}: ${updateError}`);
    } else {
      // Actualizar la lista local con la respuesta del backend
      setExpedientes(prevExpedientes =>
        prevExpedientes.map(exp =>
          exp.id === updatedExpediente.id ? updatedExpediente : exp
        )
      );
    }
    setUpdatingStatus(prev => ({ ...prev, [expediente.id]: false })); // Desmarcar como actualizando
  }, []); // Sin dependencias externas directas que cambien

  // Función auxiliar para renderizar el icono de estado
  const renderStatusIcon = (expediente) => {
    const isUpdating = updatingStatus[expediente.id];
    if (isUpdating) {
      return <i className="fas fa-spinner fa-spin text-gray-500"></i>;
    }
    if (expediente.trabajado) {
      return <i className="fas fa-check-circle text-green-500 cursor-pointer hover:text-green-700" title="Marcar como No Trabajado"></i>;
    } else {
      return <i className="fas fa-times-circle text-red-500 cursor-pointer hover:text-red-700" title="Marcar como Trabajado"></i>;
    }
  };

  // Renderizado
  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Lista de Expedientes">
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-2"> {/* Usar flex-wrap y gap para mejor responsividad */}
          <Button
            variant={filter === 'todos' ? 'primary' : 'ghost'}
            onClick={() => setFilter('todos')}
            className={filter !== 'todos' ? 'text-gray-600' : ''}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'trabajados' ? 'primary' : 'ghost'}
            onClick={() => setFilter('trabajados')}
            className={filter !== 'trabajados' ? 'text-gray-600' : ''}
          >
            Trabajados
          </Button>
          <Button
            variant={filter === 'no_trabajados' ? 'primary' : 'ghost'}
            onClick={() => setFilter('no_trabajados')}
            className={filter !== 'no_trabajados' ? 'text-gray-600' : ''}
          >
            No Trabajados
          </Button>
        </div>

        {/* Estado de Carga */}
        {loading && (
          <div className="text-center py-4">
            <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
            <p className="mt-2 text-gray-600">Cargando expedientes...</p>
          </div>
        )}

        {/* Estado de Error General */}
        {error && !loading && (
          <div className="text-center py-4 text-red-600 bg-red-100 p-3 rounded-md">
            {error} {/* Mostrar error general o específico de actualización */}
          </div>
        )}

        {/* Tabla de Expedientes */}
        {!loading && ( // Mostrar tabla incluso si hay error para ver datos previos
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número Expediente
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Centrar estado */}
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Centrar acción */}
                    Acción (Click para cambiar)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpedientes.length > 0 ? (
                  filteredExpedientes.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors duration-150"> {/* Hover en fila */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {exp.expediente_nro}
                      </td>
                       {/* Celda de Estado con padding y centrado */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${exp.trabajado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {exp.trabajado ? 'Trabajado' : 'No Trabajado'}
                         </span>
                      </td>
                      {/* Celda de Acción con padding y centrado */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleToggleTrabajado(exp)}
                          disabled={updatingStatus[exp.id]}
                          className={`focus:outline-none p-1 rounded-full hover:bg-gray-200 ${updatingStatus[exp.id] ? 'cursor-wait' : ''}`} // Añadir padding y hover al botón
                          title={exp.trabajado ? "Marcar como No Trabajado" : "Marcar como Trabajado"}
                        >
                          {renderStatusIcon(exp)}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? 'Cargando...' : 'No hay expedientes que coincidan con el filtro.'} {/* Mensaje ajustado */}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </main>
  );
}

export default BackPage;