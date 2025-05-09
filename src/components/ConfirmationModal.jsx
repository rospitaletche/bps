/* ========================================================================== */
/* Archivo: frontend/src/components/ConfirmationModal.jsx (NUEVO)            */
/* ========================================================================== */
import React from 'react';
import Button from './Button.jsx'; // Reutilizar el componente Button

/**
 * Modal de confirmación genérico.
 * @param {object} props
 * @param {boolean} props.isOpen - Controla la visibilidad del modal.
 * @param {() => void} props.onClose - Función para cerrar el modal.
 * @param {() => void} props.onConfirm - Función a ejecutar al confirmar.
 * @param {string} props.title - Título del modal.
 * @param {React.ReactNode} props.children - Contenido/mensaje del modal.
 * @param {string} [props.confirmText='Confirmar'] - Texto del botón de confirmación.
 * @param {string} [props.cancelText='Cancelar'] - Texto del botón de cancelación.
 * @param {'primary' | 'danger'} [props.confirmVariant='primary'] - Variante del botón de confirmación.
 */
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary'
}) {
  if (!isOpen) {
    return null;
  }

  return (
    // Overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Contenedor del Modal */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
        {/* Título */}
        <h3 className={`text-xl font-semibold mb-4 ${confirmVariant === 'danger' ? 'text-red-700' : 'text-secondary'}`}>
          {title}
        </h3>
        {/* Contenido/Mensaje */}
        <div className="text-sm text-gray-600 mb-6">
          {children}
        </div>
        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} className="text-gray-700 hover:bg-gray-200">
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
