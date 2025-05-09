/* ========================================================================== */
/* Archivo: frontend/src/pages/BackPage.jsx (ACTUALIZADO - Delete con Modal) */
/* ========================================================================== */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import SectionCard from '../components/SectionCard.jsx';
import Button from '../components/Button.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { getExpedientesApi, updateTrabajadoStatusApi, deleteExpedienteApi } from '../services/apiService.js';

function BackPage() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expedienteToDelete, setExpedienteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpedientes = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error: fetchError } = await getExpedientesApi(0, 100);
    if (fetchError) { setError(fetchError); }
    else {
        const validatedData = data.map(exp => ({
            ...exp, oficio: exp.oficio ?? null, juzgado: exp.juzgado ?? null,
            departamento: exp.departamento ?? null, fecha_recibido: exp.fecha_recibido ?? null,
        }));
        setExpedientes(validatedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpedientes(); }, [fetchExpedientes]);

  const filteredExpedientes = useMemo(() => {
    switch (filter) {
      case 'trabajados': return expedientes.filter(exp => exp.trabajado);
      case 'no_trabajados': return expedientes.filter(exp => !exp.trabajado);
      case 'todos': default: return expedientes;
    }
  }, [expedientes, filter]);

  const handleToggleTrabajado = useCallback(async (expediente) => {
    const newStatus = !expediente.trabajado;
    setUpdatingStatus(prev => ({ ...prev, [expediente.id]: true })); setError(null);
    const { data: updatedExpediente, error: updateError } = await updateTrabajadoStatusApi(expediente.id, newStatus);
    if (updateError) { setError(`Error al actualizar ID ${expediente.id}: ${updateError}`); }
    else { setExpedientes(prevExpedientes => prevExpedientes.map(exp => exp.id === updatedExpediente.id ? updatedExpediente : exp)); }
    setUpdatingStatus(prev => ({ ...prev, [expediente.id]: false }));
  }, []);

  const openDeleteModal = (expediente) => { setExpedienteToDelete(expediente); setIsModalOpen(true); };
  const closeDeleteModal = () => { setIsModalOpen(false); setExpedienteToDelete(null); };
  const confirmDelete = useCallback(async () => {
    if (!expedienteToDelete) return;
    setIsDeleting(true); setError(null);
    const { error: deleteError } = await deleteExpedienteApi(expedienteToDelete.id);
    setIsDeleting(false);
    if (deleteError) { setError(`Error al eliminar expediente ID ${expedienteToDelete.id}: ${deleteError}`); }
    else { setExpedientes(prev => prev.filter(exp => exp.id !== expedienteToDelete.id)); closeDeleteModal(); }
  }, [expedienteToDelete]);

  const formatDisplayDate = (dateString) => {
      if (!dateString) return 'N/A';
      try { const date = parseISO(dateString); if (isValid(date)) { return format(date, 'dd/MM/yyyy', { locale: es }); } return 'Fecha inválida'; }
      catch (e) { console.error("Error parsing date:", dateString, e); return 'Error fecha'; }
  };

  const renderStatusIcon = (expediente) => {
    const isUpdating = updatingStatus[expediente.id];
    if (isUpdating) { return <i className="fas fa-spinner fa-spin text-gray-500"></i>; }
    if (expediente.trabajado) { return <i className="fas fa-check-circle text-green-500 cursor-pointer hover:text-green-700" title="Marcar como No Trabajado"></i>; }
    else { return <i className="fas fa-times-circle text-red-500 cursor-pointer hover:text-red-700" title="Marcar como Trabajado"></i>; }
  };

  return (
    <>
      <main className="flex-grow container mx-auto px-4 py-6">
        <SectionCard title="Lista de Expedientes">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant={filter === 'todos' ? 'primary' : 'ghost'} onClick={() => setFilter('todos')} className={filter !== 'todos' ? 'text-gray-600' : ''}>Todos</Button>
            <Button variant={filter === 'trabajados' ? 'primary' : 'ghost'} onClick={() => setFilter('trabajados')} className={filter !== 'trabajados' ? 'text-gray-600' : ''}>Trabajados</Button>
            <Button variant={filter === 'no_trabajados' ? 'primary' : 'ghost'} onClick={() => setFilter('no_trabajados')} className={filter !== 'no_trabajados' ? 'text-gray-600' : ''}>No Trabajados</Button>
          </div>
          {loading && (<div className="text-center py-4"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><p className="mt-2 text-gray-600">Cargando expedientes...</p></div>)}
          {error && !loading && (<div className="text-center py-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</div>)}
          {!loading && (
            <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Expediente / Oficio</th><th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juzgado / Depto.</th><th scope="col" className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Recibido</th><th scope="col" className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th><th scope="col" className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpedientes.length > 0 ? (
                    filteredExpedientes.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-secondary">{exp.expediente_nro || 'N/A'}</div>{exp.oficio && <div className="text-xs text-gray-500 mt-1">Oficio: {exp.oficio}</div>}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-800">{exp.juzgado || 'N/A'}</div>{exp.departamento && <div className="text-xs text-gray-500">{exp.departamento}</div>}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{formatDisplayDate(exp.fecha_recibido)}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${exp.trabajado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{exp.trabajado ? 'Trabajado' : 'No Trabajado'}</span></td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                          <button onClick={() => handleToggleTrabajado(exp)} disabled={updatingStatus[exp.id]} className={`focus:outline-none p-1 rounded-full hover:bg-gray-200 ${updatingStatus[exp.id] ? 'cursor-wait' : ''}`} title={exp.trabajado ? "Marcar como No Trabajado" : "Marcar como Trabajado"}>{renderStatusIcon(exp)}</button>
                          <button onClick={() => openDeleteModal(exp)} disabled={updatingStatus[exp.id]} className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-full hover:bg-gray-200" title="Eliminar Expediente"><i className="fas fa-trash-alt"></i></button>
                        </td>
                      </tr>
                    ))
                  ) : ( <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">{loading ? 'Cargando...' : 'No hay expedientes que coincidan con el filtro.'}</td></tr> )}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </main>
      <ConfirmationModal isOpen={isModalOpen} onClose={closeDeleteModal} onConfirm={confirmDelete} title="Confirmar Eliminación" confirmText={isDeleting ? "Eliminando..." : "Eliminar"} confirmVariant="danger" disabled={isDeleting}>
        <p>¿Estás seguro de que deseas eliminar el expediente <strong className="font-semibold">{expedienteToDelete?.expediente_nro}</strong>?</p>
        <p className="text-xs text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
      </ConfirmationModal>
    </>
  );
}
export default BackPage;