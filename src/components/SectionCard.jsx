/* ========================================================================== */
/* Archivo: frontend/src/components/SectionCard.jsx                          */
/* ========================================================================== */

import React from 'react';

/**
 * Contenedor de Sección con título opcional.
 * @param {object} props - Propiedades
 */
function SectionCard({ children, title, className = '', id }) {
  return (
    <div id={id} className={`bg-white rounded-lg shadow-md p-6 mb-6 ${className}`}>
      {/* Título usa color secundario definido en config */}
      {title && <h2 className="text-2xl font-semibold text-secondary mb-4">{title}</h2>}
      {children}
    </div>
  );
}
export default SectionCard;
