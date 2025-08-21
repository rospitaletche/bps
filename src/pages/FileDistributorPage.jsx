/* ========================================================================== */
/* Archivo: frontend/src/pages/FileDistributorPage.jsx (NUEVO)               */
/* ========================================================================== */
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import SectionCard from '../components/SectionCard.jsx';
import Button from '../components/Button.jsx';

const availableUsers = [
  'Alfredo', 'Ana', 'Daniela', 'Eduardo', 'Juan', 
  'Manuela', 'Maria', 'Matias', 'Ricardo'
];

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
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (data.length > 1) {
            setHeaders(data[0]);
            setFileData(XLSX.utils.sheet_to_json(worksheet)); // Usamos la conversión a objetos para facilitar el manejo
          } else {
            setError("El archivo Excel está vacío o no tiene un formato válido.");
          }
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

    // Usamos un timeout para que el estado de 'isProcessing' se refleje en la UI
    setTimeout(async () => {
        try {
            const users = Array.from(selectedUsers);
            const totalRows = fileData.length;
            const numUsers = users.length;

            // Lógica de distribución
            const baseRowsPerUser = Math.floor(totalRows / numUsers);
            let remainder = totalRows % numUsers;

            // Aleatorizar usuarios para que la distribución del resto sea justa
            const shuffledUsers = users.sort(() => 0.5 - Math.random());

            const zip = new JSZip();
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
                    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    zip.file(`${user}.xlsx`, excelBuffer);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "distribucion_tareas.zip");

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

        {/* Dropzone */}
        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-secondary bg-primary/20' : 'border-primary bg-primary/10'}`}>
          <input {...getInputProps()} />
          <i className="fas fa-file-excel text-5xl text-primary mb-3"></i>
          {file ? (
            <p className="text-gray-800">Archivo cargado: <strong>{file.name}</strong> ({fileData.length} filas de datos detectadas)</p>
          ) : (
            <p className="text-gray-700">Arrastre un archivo Excel aquí, o haga clic para seleccionar.</p>
          )}
        </div>

        {/* User Selection */}
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

        {/* Action Button */}
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