import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import SectionCard from '../components/SectionCard.jsx';
import Button from '../components/Button.jsx';

const availableUsers = [
  'Alfredo', 'Ana', 'Daniela', 'Eduardo', 'Juan', 
  'Manuela', 'Maria', 'Matias', 'Ricardo'
];

// Constantes para las columnas de filtrado para evitar errores de tipeo
const DESTINATION_COLUMN = 'Localidad / Departamento de destino';
const RESOLUTION_COLUMN = 'Resol. Junasa';

function FileDistributorPage() {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setError('');
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const dataAsArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const headerIndex = dataAsArray.findIndex(row => 
            row.length > 0 && String(row[0]).trim() === 'Fecha'
          );

          if (headerIndex === -1) {
            setError("No se pudo encontrar la fila de encabezado que comienza con 'Fecha'. Verifique el formato del archivo.");
            return;
          }

          const foundHeaders = dataAsArray[headerIndex];
          const dataRows = dataAsArray.slice(headerIndex + 1);

          const jsonData = dataRows.map(row => {
            const obj = {};
            foundHeaders.forEach((header, i) => {
              let cellValue = row[i];
              if (cellValue instanceof Date) {
                cellValue = cellValue.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
              }
              obj[header] = cellValue;
            });
            return obj;
          });

          const filteredData = jsonData.filter(row => {
            const destination = row[DESTINATION_COLUMN];
            const resolution = row[RESOLUTION_COLUMN];
            
            const hasData = Object.values(row).some(val => val !== undefined && val !== null && val !== '');
            if (!hasData) return false;

            const isMontevideo = destination && typeof destination === 'string' && destination.toUpperCase().includes('MONTEVIDEO');
            const isPending = resolution && typeof resolution === 'string' && resolution.toUpperCase().includes('PENDIENTE');

            return !isMontevideo && !isPending;
          });

          setHeaders(foundHeaders);
          setFileData(filteredData);

        } catch (e) {
          console.error("Error reading XLSX file:", e);
          setError("No se pudo procesar el archivo. Asegúrese de que sea un archivo Excel (.xlsx, .xls) válido.");
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

  const handleUserToggle = (user) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(user)) {
      newSelection.delete(user);
    } else {
      newSelection.add(user);
    }
    setSelectedUsers(newSelection);
  };

  const handleDistribute = async () => {
    if (selectedUsers.size === 0 || fileData.length === 0) {
        setError("Por favor, cargue un archivo y seleccione al menos un usuario.");
        return;
    }
    setIsProcessing(true);
    setError('');

    setTimeout(() => {
        try {
            const users = Array.from(selectedUsers);
            const totalRows = fileData.length;
            const numUsers = users.length;

            const baseRowsPerUser = Math.floor(totalRows / numUsers);
            let remainder = totalRows % numUsers;
            const shuffledUsers = users.sort(() => 0.5 - Math.random());

            let currentIndex = 0;

            for (const user of shuffledUsers) {
                const rowsForThisUser = baseRowsPerUser + (remainder > 0 ? 1 : 0);
                const userChunk = fileData.slice(currentIndex, currentIndex + rowsForThisUser);
                currentIndex += rowsForThisUser;
                if (remainder > 0) remainder--;

                if (userChunk.length > 0) {
                    const worksheet = XLSX.utils.json_to_sheet(userChunk);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas");
                    XLSX.writeFile(workbook, `${user}.xlsx`);
                }
            }
        } catch (e) {
            console.error("Error distributing files:", e);
            setError("Ocurrió un error al generar los archivos.");
        } finally {
            setIsProcessing(false);
        }
    }, 100);
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Distribución de Tareas desde Excel">
        <p className="text-sm text-gray-600 mb-4">
          Cargue un archivo Excel, seleccione los usuarios y la herramienta distribuirá las filas de manera equitativa, generando un archivo Excel para cada usuario.
        </p>

        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-secondary bg-primary/20' : 'border-primary bg-primary/10'}`}>
          <input {...getInputProps()} />
          <i className="fas fa-file-excel text-5xl text-primary mb-3"></i>
          {file ? (
            <p className="text-gray-800">Archivo cargado: <strong>{file.name}</strong> ({fileData.length} filas de datos para distribuir)</p>
          ) : (
            <p className="text-gray-700">Arrastre un archivo Excel aquí, o haga clic para seleccionar.</p>
          )}
        </div>

        {fileData.length > 0 && (
          <div className="my-6">
            <h3 className="text-lg font-semibold text-secondary mb-3">Seleccionar Usuarios para Distribuir</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {availableUsers.map(user => (
                <label key={user} className="flex items-center space-x-2 p-3 bg-gray-50 border rounded-md hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user)}
                    onChange={() => handleUserToggle(user)}
                    className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-gray-800 font-medium">{user}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button onClick={handleDistribute} disabled={isProcessing || fileData.length === 0 || selectedUsers.size === 0}>
            {isProcessing ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Distribuyendo Archivos...</>
            ) : (
              <><i className="fas fa-sitemap mr-2"></i>Distribuir Tareas ({selectedUsers.size} usuarios)</>
            )}
          </Button>
        </div>

        {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </SectionCard>
    </main>
  );
}

export default FileDistributorPage;