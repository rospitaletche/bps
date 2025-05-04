/* ========================================================================== */
/* Archivo: frontend/src/components/CheckboxWithNumber.jsx                   */
/* ========================================================================== */

import React from 'react';

/**
 * Checkbox personalizado con input numérico deshabilitable.
 * @param {object} props - Propiedades
 */
function CheckboxWithNumber({ id, checked, onCheckboxChange, numberValue, onNumberChange, labelPrefix, min = 1, max = 99 }) {

  const labelText = `${labelPrefix}`;
  const isNumberInputDisabled = !checked;

  return (
    <div className="flex items-center mb-2">
      {/* Checkbox */}
      <div className="custom-checkbox mr-3">
        <input
          type="checkbox"
          id={id}
          className="hidden"
          checked={checked}
          onChange={onCheckboxChange}
        />
        <label htmlFor={id} className="flex items-center cursor-pointer">
          {/* Icono visual */}
          <span className={`w-5 h-5 border-2 border-primary rounded mr-2 flex items-center justify-center transition-all duration-200 ${checked ? 'bg-primary' : 'bg-white'}`}>
            {checked && <i className="fas fa-check text-white text-xs"></i>}
          </span>
          <span className="text-gray-700">{labelText}</span>
        </label>
      </div>
      {/* Input numérico */}
      <input
        type="number"
        id={`${id}-number`}
        value={numberValue}
        onChange={onNumberChange}
        min={min}
        max={max}
        disabled={isNumberInputDisabled}
        className={`w-14 text-center px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:ring-opacity-50 text-sm transition duration-150 ease-in-out bg-white disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed`}
      />
    </div>
  );
}
export default CheckboxWithNumber;