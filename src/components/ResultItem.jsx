/* ========================================================================== */
/* Archivo: frontend/src/components/ResultItem.jsx                           */
/* ========================================================================== */

import React from 'react';
import useCopyToClipboard from '../hooks/useCopyToClipboard.js'; // Ajusta ruta si es necesario
import Button from './Button.jsx'; // Ajusta ruta si es necesario

/**
 * Muestra un resultado con un botón para copiar.
 * @param {object} props - Propiedades
 */
function ResultItem({ label, value, id }) {
  const [copied, copy] = useCopyToClipboard();
  const handleCopy = () => { copy(value); };

  return (
    <div className="mb-4">
      {/* Label usa color secundario */}
      {label && <div className="font-medium text-secondary mb-2">{label}</div>}
      <div className="flex items-center">
        {/* Campo de valor */}
        <div id={id} className="flex-grow bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-700">
          {value}
        </div>
        {/* Botón de copiar */}
        <Button
          onClick={handleCopy}
          title="Copiar"
          variant="ghost" // Estilo gris claro
          className="ml-2 px-3 py-2 hover:text-primary" // Hover usa color primario
        >
          {/* Icono cambia al copiar */}
          <i className={` ${copied ? 'fas fa-check text-green-500' : 'far fa-copy'}`}></i>
        </Button>
      </div>
    </div>
  );
}
export default ResultItem;
