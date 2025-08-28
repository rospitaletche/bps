import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import SectionCard from '../components/SectionCard.jsx';
import ClipboardCopy from '../components/ClipboardCopy.jsx'; // Reutilizamos el componente

// Solución definitiva para Vite: Importar el worker con '?url' para que Vite genere la ruta correcta.
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;


const initialExtractedData = {
  nroDocumento: '',
  prestadorActual: '',
  prestadorNuevo: '',
  nombre: '',
  apellido: '',
  motivo: '',
};

// --- Listas de Verificación ---
const incumplimientoPlazosChecklist = [
  "Cédula de identidad vigente del solicitante o apoderado. Para el trámite en línea, deben adjuntarse ambos lados del documento de identidad vigente.",
  "Declaración jurada donde se especifica la causal del cambio y se declaran los datos correspondientes a cada caso.",
  "Carta firmada por el interesado donde detalle el motivo de la solicitud del cambio.",
  "Comprobante emitido por el prestador de salud en el que conste la fecha de la solicitud de la cita y la fecha para la cual se concedió esta.",
  "En caso de procedimiento quirúrgico, cuando haya vencido el plazo de coordinación estipulado en el decreto 359/007, se debe presentar copia de Historia clínica, en la que conste la indicación de dicha cirugía y la realización de los exámenes clínicos preoperatorios. De no haberse realizado estos, se deberá aclarar las razones de esta omisión. En caso de que el médico tratante no haya dejado constancia de indicación de cirugía en la Historia clínica, se podrá presentar una copia del consentimiento informado, debidamente firmado."
];

const otroMotivoChecklist = [
  "Cédula de identidad vigente del solicitante o apoderado. Para el trámite en línea, deben adjuntarse ambos lados del documento de identidad vigente.",
  "Declaración jurada donde se especifica el motivo del cambio y se declaran los datos correspondientes a cada caso.",
  "Nota con exposición de motivos en la que, explícitamente, se debe indicar el nuevo prestador de salud elegido y los datos personales del titular (domicilio, teléfono, celular, correo electrónico).",
  "Documentación probatoria de lo manifestado (parte de la historia clínica que justifique el motivo de la solicitud, nota del médico tratante, certificados médicos, etc.)."
];


function ExpedientesPage() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(initialExtractedData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [expedienteNro, setExpedienteNro] = useState('');
  const [checkedItems, setCheckedItems] = useState(new Set()); // Estado para el checklist

  const handleCheckItem = (itemText) => {
    setCheckedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemText)) {
            newSet.delete(itemText);
        } else {
            newSet.add(itemText);
        }
        return newSet;
    });
  };

  const extractDataFromText = (text) => {
    const data = { ...initialExtractedData };
    
    const nroDocRegex = /Nro\.\s*de\s*documento:\s*(\d[\d\.]*\d)/;
    const prestadorActualRegex = /Prestador\s*de\s*salud\s*actual:\s*(.*?)\s*Nuevo\s*prestador\s*de\s*salud:/s;
    const prestadorNuevoRegex = /Nuevo\s*prestador\s*de\s*salud:\s*(.*?)\s*Documentación/s;
    const nombreRegex = /Nombre:\s*(.*?)\s*Apellido:/s;
    const apellidoRegex = /Apellido:\s*(.*?)\s*(?:Fecha\s*de\s*nacimiento:|Dirección\s*de\s*email:)/s;
    const motivoRegex = /Motivo\s*de\s*la\s*solicitud:\s*(.*?)\s*(?:Declaración\s*jurada:|Nota\s*de\s*solicitud:)/s;

    const nroDocMatch = text.match(nroDocRegex);
    if (nroDocMatch) data.nroDocumento = nroDocMatch[1].replace(/\./g, '');

    const prestadorActualMatch = text.match(prestadorActualRegex);
    if (prestadorActualMatch) data.prestadorActual = prestadorActualMatch[1].replace(/\*/g, '').trim();
    
    const prestadorNuevoMatch = text.match(prestadorNuevoRegex);
    if (prestadorNuevoMatch) data.prestadorNuevo = prestadorNuevoMatch[1].replace(/\*/g, '').trim();

    const nombreMatch = text.match(nombreRegex);
    if (nombreMatch) data.nombre = nombreMatch[1].trim();

    const apellidoMatch = text.match(apellidoRegex);
    if (apellidoMatch) data.apellido = apellidoMatch[1].trim();

    const motivoMatch = text.match(motivoRegex);
    if (motivoMatch) data.motivo = motivoMatch[1].trim();

    return data;
  };

  const onDrop = async (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setError('');
    setFile(uploadedFile);
    setExtractedData(initialExtractedData);
    setExpedienteNro('');
    setCheckedItems(new Set()); // Resetear checklist
    setIsProcessing(true);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ');
      }
      
      const data = extractDataFromText(fullText);
      setExtractedData(data);

    } catch (e) {
      console.error("Error processing PDF:", e);
      setError("No se pudo procesar el archivo PDF. Verifique que sea válido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const asuntoText = `CI ${extractedData.nroDocumento}, ${extractedData.nombre} ${extractedData.apellido}, Cambio Mutual de ${extractedData.prestadorActual} a ${extractedData.prestadorNuevo}.`;
  const hasData = !!extractedData.nroDocumento;
  const currentChecklist = extractedData.motivo.toLowerCase().includes('incumplimiento') ? incumplimientoPlazosChecklist : otroMotivoChecklist;

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Procesador de Expedientes">
        <p className="text-sm text-gray-600 mb-4">
          Cargue un archivo PDF de solicitud para generar una guía de trabajo interactiva.
        </p>

        {/* Dropzone */}
        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-secondary bg-primary/20' : 'border-primary bg-primary/10'}`}>
          <input {...getInputProps()} />
          <i className="fas fa-file-pdf text-5xl text-primary mb-3"></i>
          {isProcessing ? (
               <p className="text-gray-800"><i className="fas fa-spinner fa-spin mr-2"></i>Procesando PDF...</p>
          ) : file ? (
            <p className="text-gray-800">Archivo: <strong>{file.name}</strong></p>
          ) : (
            <p className="text-gray-700">Arrastre un PDF aquí, o haga clic para seleccionar.</p>
          )}
        </div>
        {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </SectionCard>

      {/* Cards de Trabajo */}
      {hasData && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 1: Verificación */}
          <SectionCard title={`Paso 1: Verificación (${extractedData.motivo})`}>
            <div className="space-y-3">
              {currentChecklist.map((item, index) => (
                <ChecklistItem 
                  key={index}
                  text={item}
                  isChecked={checkedItems.has(item)}
                  onToggle={() => handleCheckItem(item)}
                />
              ))}
            </div>
          </SectionCard>

          {/* CARD 2: Iniciar Expediente */}
          <SectionCard title="Paso 2: Iniciar Expediente">
            <div className="space-y-4">
              <InfoItem label="Oficina" value="1481 GUDE Deslocalizado" />
              <InfoItem label="Tipo de expediente" value="Cambio Mutual" />
              <CopyItem label="Asunto" textToCopy={asuntoText} />
              <CopyItem label="Agregar Persona" textToCopy={extractedData.nroDocumento} />
              <InfoItem label="Seleccionar" value="Confidencial" />
              <InfoItem label="Realizar actuación, marcando" value="Si" />
              <InputItem 
                label="Nro de expediente" 
                value={expedienteNro} 
                onChange={(e) => setExpedienteNro(e.target.value)} 
                placeholder="Pegue el nro. de expediente aquí"
              />
              <InfoItem label="Acción final" value="Descargar carátula" />
            </div>
          </SectionCard>

          {/* CARD 3: Notificación */}
          <SectionCard title="Paso 3: Notificación">
             <div className="space-y-4">
               <InfoItem label="Acción" value="Selecciono fecha de notificación" />
               <CopyItem 
                 label="Nro. de trámite" 
                 textToCopy={expedienteNro} 
                 disabled={!expedienteNro}
               />
            </div>
          </SectionCard>
        </div>
      )}
    </main>
  );
}

// --- Componentes Auxiliares para las Tarjetas ---

const ChecklistItem = ({ text, isChecked, onToggle }) => (
    <div 
        className="flex items-start space-x-3 cursor-pointer group p-2 rounded-md hover:bg-primary/10"
        onClick={onToggle}
    >
        <i className={`far ${isChecked ? 'fa-check-square text-primary' : 'fa-square text-gray-400'} mt-1 group-hover:text-primary transition-colors`}></i>
        <p className={`text-sm transition-colors ${isChecked ? 'line-through text-gray-500' : 'text-gray-700'}`}>
            {text}
        </p>
    </div>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800 font-semibold">{value}</p>
  </div>
);

const CopyItem = ({ label, textToCopy, disabled = false }) => (
  <div>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    {disabled ? (
      <p className="text-sm text-gray-400 italic font-mono bg-gray-100 p-2 rounded border">
        (esperando Nro. de expediente)
      </p>
    ) : (
      <ClipboardCopy textToCopy={textToCopy} />
    )}
  </div>
);

const InputItem = ({ label, value, onChange, placeholder }) => (
  <div>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <input 
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 block w-full text-sm px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
    />
  </div>
);


export default ExpedientesPage;
