import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import SectionCard from '../components/SectionCard.jsx';
import ClipboardCopy from '../components/ClipboardCopy.jsx';

// Función para formatear fechas de Excel (números de serie) a un formato legible
const formatDate = (excelDate) => {
    if (typeof excelDate === 'number') {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toLocaleDateString('es-UY'); // Formato dd/mm/aaaa
    }
    return excelDate; // Devolver el valor original si no es un número
};

function AuthorizationsPage() {
  const [file, setFile] = useState(null);
  const [authorizations, setAuthorizations] = useState([]);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(null); // Estado para la tarjeta activa

  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setError('');
      setFile(uploadedFile);
      setActiveIndex(null); // Resetear selección al cargar nuevo archivo
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const dataAsArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const headerIndex = dataAsArray.findIndex(row => 
            row.length > 0 && String(row[0]).trim() === 'Fecha'
          );

          if (headerIndex === -1) {
            setError("No se pudo encontrar la fila de encabezado que comienza con 'Fecha'. Verifique el formato del archivo.");
            setAuthorizations([]);
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });
          setAuthorizations(jsonData);

        } catch (e) {
          console.error("Error reading XLSX file:", e);
          setError("No se pudo procesar el archivo. Asegúrese de que sea un archivo Excel (.xlsx, .xls) válido.");
          setAuthorizations([]);
        }
      };
      reader.readAsBinaryString(uploadedFile);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const handleCardSelect = (index) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Procesador de Autorizaciones">
        <p className="text-sm text-gray-600 mb-4">
          Cargue un archivo Excel de tareas (ej: "Ricardo.xlsx") para generar tarjetas de trabajo con información lista para copiar.
        </p>

        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-secondary bg-primary/20' : 'border-primary bg-primary/10'}`}>
          <input {...getInputProps()} />
          <i className="fas fa-file-invoice text-5xl text-primary mb-3"></i>
          {file ? (
            <p className="text-gray-800">Archivo cargado: <strong>{file.name}</strong> ({authorizations.length} autorizaciones encontradas)</p>
          ) : (
            <p className="text-gray-700">Arrastre un archivo Excel aquí, o haga clic para seleccionar.</p>
          )}
        </div>
        {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </SectionCard>

      {authorizations.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authorizations.map((auth, index) => {
            const ci = auth['C.I.'] || 'N/A';
            const nombre = auth['Nombre y Apellido'] || 'N/A';
            const instActual = auth['Inst. Actual'] || 'N/A';
            const instElegida = auth['Inst. Elegida'] || 'N/A';
            const nResolucion = auth['N° Resol. Junasa'] || 'N/A';
            const fechaResolucion = formatDate(auth['Fecha Resol. Junasa']) || 'N/A';
            const textoResolucion = `Se ingresa resolución JUNASA ${nResolucion}, de fecha ${fechaResolucion}. Concede.`;
            
            const isSelected = activeIndex === index;
            const isAnySelected = activeIndex !== null;

            const cardClasses = `
              relative bg-white p-4 rounded-lg shadow border flex flex-col space-y-3 transition-all duration-300
              ${isSelected ? 'border-primary shadow-xl scale-105' : 'border-gray-200'}
              ${isAnySelected && !isSelected ? 'opacity-50 scale-95' : ''}
            `;

            return (
              <div key={index} className={cardClasses}>
                <button 
                  onClick={() => handleCardSelect(index)}
                  className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500 hover:bg-primary hover:text-white'}`}
                  title={isSelected ? 'Dejar de enfocar' : 'Enfocar esta tarjeta'}
                >
                  <i className="fas fa-bullseye"></i>
                </button>

                <div className="flex items-center space-x-3 pr-8">
                  <ClipboardCopy textToCopy={ci} />
                  <span className="text-gray-800 font-semibold truncate">{nombre}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">De: {instActual} a</span>
                  <ClipboardCopy textToCopy={instElegida} />
                </div>
                <div className="flex items-center">
                  <ClipboardCopy textToCopy={nResolucion} />
                </div>
                <div className="pt-3 border-t">
                  <ClipboardCopy textToCopy={textoResolucion} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default AuthorizationsPage;