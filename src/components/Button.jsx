/* ========================================================================== */
/* Archivo: frontend/src/components/Button.jsx                               */
/* ========================================================================== */

import React from 'react';

/**
 * Componente de Botón Reutilizable
 * @param {object} props - Propiedades
 */
function Button({ onClick, children, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  // Estilos base y variantes usando colores definidos en tailwind.config.js
  const baseStyle = "px-4 py-2 rounded font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-75 shadow";
  let variantStyle = '';
  switch (variant) {
    case 'secondary': variantStyle = "bg-secondary text-white hover:bg-opacity-90 focus:ring-secondary"; break;
    case 'ghost': variantStyle = "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300 shadow-none"; break;
    case 'primary': default: variantStyle = "bg-primary text-white hover:bg-secondary focus:ring-primary"; break;
  }
  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export default Button;
