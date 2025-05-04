/* ========================================================================== */
/* Archivo: frontend/src/components/ExpedienteInput.jsx                      */
/* ========================================================================== */

import React from 'react';

/**
 * Input con prefijo fijo.
 * @param {object} props - Propiedades
 */
function ExpedienteInput({ id, label, prefix, placeholder, value, onChange }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block font-medium text-gray-700 mb-2">{label}</label>
      {/* Estilo del contenedor con focus-within */}
      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-30 transition duration-200">
        <span className="prefix bg-gray-100 text-gray-600 px-3 py-2 border-r border-gray-300">{prefix}</span>
        <input
          type="text"
          id={id}
          className="border-none px-3 py-2 flex-grow focus:outline-none"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
export default ExpedienteInput;