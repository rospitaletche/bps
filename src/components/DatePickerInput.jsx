/* ========================================================================== */
/* Archivo: frontend/src/components/DatePickerInput.jsx (NUEVO)              */
/* ========================================================================== */
import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isValid, parse } from 'date-fns';
import { es } from 'date-fns/locale'; // Importar locale español
import 'react-day-picker/dist/style.css'; // Importar estilos base de react-day-picker

/**
 * Componente de selección de fecha con popover.
 * @param {object} props
 * @param {string} props.label - Etiqueta para el input.
 * @param {Date | null} props.selectedDate - La fecha seleccionada (objeto Date).
 * @param {(date: Date | null) => void} props.onDateChange - Función callback cuando la fecha cambia.
 * @param {string} [props.placeholder='Seleccionar fecha'] - Placeholder para el input.
 */
function DatePickerInput({ label, selectedDate, onDateChange, placeholder = 'Seleccionar fecha' }) {
  const [showPopover, setShowPopover] = useState(false);
  const [inputValue, setInputValue] = useState(selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Intentar parsear la fecha mientras se escribe
    const parsedDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
    if (isValid(parsedDate)) {
      onDateChange(parsedDate);
    } else {
      onDateChange(null); // Resetear si no es válida
    }
  };

  const handleDaySelect = (date) => {
    if (date && isValid(date)) {
        onDateChange(date);
        setInputValue(format(date, 'dd/MM/yyyy'));
        setShowPopover(false); // Cerrar popover al seleccionar
    } else {
        // Manejar caso donde date podría ser undefined si se deselecciona
        onDateChange(null);
        setInputValue('');
        setShowPopover(false);
    }
  };

  const handleInputClick = () => {
    setShowPopover(true);
  };

  const handleInputBlur = (e) => {
    // Cerrar popover si se hace clic fuera, usando relatedTarget
    // Necesita un pequeño delay para permitir el clic dentro del DayPicker
    setTimeout(() => {
        if (!e.relatedTarget?.closest('.rdp-popover')) {
            setShowPopover(false);
            // Re-formatear o validar al perder foco
            if (selectedDate) {
                setInputValue(format(selectedDate, 'dd/MM/yyyy'));
            } else {
                 // Si el texto no es una fecha válida, limpiar
                 const parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date());
                 if (!isValid(parsedDate)) {
                     setInputValue('');
                 }
            }
        }
    }, 100);
  };

  return (
    <div className="mb-4 relative">
      <label htmlFor="date-input" className="block font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          id="date-input"
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onBlur={handleInputBlur} // Usar onBlur para manejar cierre
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:ring-opacity-50"
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
           <i className="fas fa-calendar-alt"></i>
        </span>
      </div>

      {showPopover && (
        <div
          className="rdp-popover absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2"
          // Añadir tabIndex y focus/blur para manejo de teclado/foco
          tabIndex={-1}
          onFocus={() => setShowPopover(true)} // Mantener abierto si el foco entra
          onBlur={handleInputBlur} // Usar el mismo blur handler
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            locale={es} // Usar locale español
            showOutsideDays
            fixedWeeks
            // Estilos opcionales para el popover (se pueden definir en index.css también)
            // classNames={{ ... }}
            // styles={{ ... }}
            // Navegación por meses/años
            captionLayout="dropdown-buttons"
            fromYear={new Date().getFullYear() - 10} // Rango de años
            toYear={new Date().getFullYear() + 5}
          />
        </div>
      )}
    </div>
  );
}

export default DatePickerInput;