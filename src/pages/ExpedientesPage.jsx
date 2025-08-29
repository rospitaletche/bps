import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
// import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import jsPDF from "jspdf";
import "jspdf-autotable";

import SectionCard from "../components/SectionCard.jsx";
import ClipboardCopy from "../components/ClipboardCopy.jsx";

// Worker de pdf.js (Vite)
//import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker?url';
//pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const STORAGE_KEY = "bps_expedientes_progress_v1";

const initialExtractedData = {
  nroDocumento: "",
  prestadorActual: "",
  prestadorNuevo: "",
  nombre: "",
  apellido: "",
  motivo: "",
  gestionId: "",      // <- nuevo (ej: hlh_prv_chg_22347)
  gestionNumero: "",  // <- nuevo (ej: 22347)
};


// --- Listas de Verificación ---
const incumplimientoPlazosChecklist = [
  "Cédula de identidad vigente del solicitante o apoderado. Para el trámite en línea, deben adjuntarse ambos lados del documento de identidad vigente.",
  "Declaración jurada donde se especifica la causal del cambio y se declaran los datos correspondientes a cada caso.",
  "Carta firmada por el interesado donde detalle el motivo de la solicitud del cambio.",
  "Comprobante emitido por el prestador de salud en el que conste la fecha de la solicitud de la cita y la fecha para la cual se concedió esta.",
  "En caso de procedimiento quirúrgico, cuando haya vencido el plazo de coordinación estipulado en el decreto 359/007, se debe presentar copia de Historia clínica, en la que conste la indicación de dicha cirugía y la realización de los exámenes clínicos preoperatorios. De no haberse realizado estos, se deberá aclarar las razones de esta omisión. En caso de que el médico tratante no haya dejado constancia de indicación de cirugía en la Historia clínica, se podrá presentar una copia del consentimiento informado, debidamente firmado.",
];

const otroMotivoChecklist = [
  "Cédula de identidad vigente del solicitante o apoderado. Para el trámite en línea, deben adjuntarse ambos lados del documento de identidad vigente.",
  "Declaración jurada donde se especifica el motivo del cambio y se declaran los datos correspondientes a cada caso.",
  "Nota con exposición de motivos en la que, explícitamente, se debe indicar el nuevo prestador de salud elegido y los datos personales del titular (domicilio, teléfono, celular, correo electrónico).",
  "Documentación probatoria de lo manifestado (parte de la historia clínica que justifique el motivo de la solicitud, nota del médico tratante, certificados médicos, etc.).",
];

// --- Textos dinámicos usados en BPMS (Paso 3)
const DYNAMIC_TEXTS = {
  // (C) – se mostrará como botón de copia SOLO si el motivo incluye exactamente "Incumplimiento plazos prestador" (case-insensitive)
  incumplimientoCorreo:
    `Asimismo, en aplicación de lo establecido en el Artículo 2º literal c del Dec.114/023 de fecha 30 marzo de 2023 (el cual se incluye), se le intima a suministrar el comprobante que el decreto exige, bajo apercibimiento de continuar las actuaciones cuando haya vencido el plazo otorgado en el párrafo anterior sin haberlo presentado.\n\nArtículo 2º.- […] c) el prestador integral de salud deberá suministrar al usuario un comprobante en el que conste la fecha de la solicitud de la cita y la fecha para la cual se concedió la misma, cualquiera sea la modalidad de agenda.`,
};

// --- Paso 4: Finalización APIA — documentos esperados y fojas
const FOJA_DOCS = [
  { key: "ci", label: "Documento de identidad del titular" },
  { key: "form", label: "Formulario de cambio de prestador asistencial" },
  { key: "docs", label: "Documentación aportada por el titular" },
  { key: "consulta", label: "Consulta de afiliación mutual detallada" },
  { key: "correo", label: "Correo electrónico (vista electrónica)" },
];

const INITIAL_FOJAS = FOJA_DOCS.reduce((acc, { key }) => {
  acc[key] = { from: "", to: "" };
  return acc;
}, {});

function ExpedientesPage() {
  const [file, setFile] = useState(null);
  const [filePreviewURL, setFilePreviewURL] = useState(null);
  const [pdfMeta, setPdfMeta] = useState({ pages: 0 });
  const [extractedData, setExtractedData] = useState(initialExtractedData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [expedienteNro, setExpedienteNro] = useState("");
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [fojas, setFojas] = useState(INITIAL_FOJAS);
  const [vtiggerModo, setVtiggerModo] = useState("sucursal"); // 'sucursal' | 'virtual'


  // Para evitar que al cambiar archivo perdamos accidentalmente el estado sin guardar
  const isDirtyRef = useRef(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  useEffect(() => {
    // Cargar progreso si existe
    const saved = safeLoad(getCurrentStorageKey());
    if (saved) {
      setExtractedData(saved.extractedData || initialExtractedData);
      setCheckedItems(new Set(saved.checkedItems || []));
      setExpedienteNro(saved.expedienteNro || "");
      setFojas(saved.fojas || INITIAL_FOJAS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Crear / limpiar vista previa PDF
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreviewURL(url);
      return () => URL.revokeObjectURL(url);
    } else {
      if (filePreviewURL) URL.revokeObjectURL(filePreviewURL);
      setFilePreviewURL(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    // Señalar que hay cambios no guardados
    isDirtyRef.current = true;
  }, [extractedData, expedienteNro, checkedItems, fojas]);

  function getCurrentStorageKey() {
    return `${STORAGE_KEY}::${expedienteNro || file?.name || "session"}`;
  }

  function safeSave(key) {
    try {
      const payload = {
        extractedData,
        expedienteNro,
        checkedItems: Array.from(checkedItems),
        pdfMeta,
        ts: Date.now(),
        fileName: file?.name || null,
        fojas,
      };
      localStorage.setItem(key, JSON.stringify(payload));
      isDirtyRef.current = false;
      return true;
    } catch (e) {
      console.error("Error guardando progreso:", e);
      return false;
    }
  }

  function safeLoad(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error cargando progreso:", e);
      return null;
    }
  }

  const handleCheckItem = (itemText) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemText)) newSet.delete(itemText);
      else newSet.add(itemText);
      return newSet;
    });
  };

  const asuntoText = useMemo(() => {
    const { nroDocumento, nombre, apellido, prestadorActual, prestadorNuevo } = extractedData;
    const parts = [];
    if (nroDocumento) parts.push(`CI ${nroDocumento}`);
    if (nombre || apellido) parts.push(`${nombre || ""} ${apellido || ""}`.trim());
    if (prestadorActual || prestadorNuevo)
      parts.push(`Cambio Mutual de ${prestadorActual || "?"} a ${prestadorNuevo || "?"}`);
    return parts.join(", ") + ".";
  }, [extractedData]);

  // Coincidencia del texto específico (case-insensitive) "incumplimiento plazos prestador"
  const normalizedMotivo = (extractedData.motivo || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const isIncumplimiento = normalizedMotivo.includes("incumplimiento plazos prestador");

  const hasData = !!extractedData.nroDocumento || !!extractedData.nombre || !!extractedData.apellido;
  const currentChecklist = isIncumplimiento ? incumplimientoPlazosChecklist : otroMotivoChecklist;

  async function handleDrop(acceptedFiles) {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    if (isDirtyRef.current) {
      // Guardado automático del estado previo
      safeSave(getCurrentStorageKey());
    }

    setError("");
    setFile(uploadedFile);
    setExtractedData(initialExtractedData);
    setExpedienteNro("");
    setCheckedItems(new Set());
    setPdfMeta({ pages: 0 });
    setFojas(INITIAL_FOJAS);
    setIsProcessing(true);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      setPdfMeta({ pages: pdf.numPages });
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
      }

      const normalized = normalizeText(fullText);
      const data = extractDataFromText(normalized);
      setExtractedData(data);
    } catch (e) {
      console.error("Error processing PDF:", e);
      setError("No se pudo procesar el archivo PDF. Verifique que sea válido.");
    } finally {
      setIsProcessing(false);
    }
  }

  function normalizeText(text) {
    return text
      .replace(/[\r\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/Nº|N°/g, "Nro.")
      .replace(/C\.I\.|CI\b/gi, "CI")
      .trim();
  }

  // (1) --- Añadí estos helpers arriba (por ejemplo, junto a normalizeText) ---
const STOP_AFTER_PROVIDER =
  /\s+(?=doc-|https?:|Apia\b|\S+\.pdf|\d+\s+de\s+\d+|Documentaci[oó]n\b|Datos\b|Usuario\b|Oficina\b|$)/i;

function sanitizeProvider(raw) {
  if (!raw) return "";
  // quitar asteriscos y espacios raros
  let s = raw.replace(/\*/g, " ").replace(/\s{2,}/g, " ").trim();
  // cortar en cuanto aparezca un token "sospechoso"
  const cut = s.split(STOP_AFTER_PROVIDER)[0] || s;
  // si quedara muy largo, limita a 3 palabras (evita “arrastres” raros)
  const words = cut.trim().split(/\s+/);
  const compact = cut.length > 40 && words.length > 3 ? words.slice(0, 3).join(" ") : cut;
  return compact.trim();
}


  // (2) --- Reemplazá tu extractDataFromText por esta versión (respeta tus regex previos y agrega los "estrictos") ---
function extractDataFromText(text) {
  const data = { ...initialExtractedData };

  // Variantes para número de documento
  const nroDocRegexes = [
    /Nro\.\s*de\s*documento:\s*(\d[\d\.]*\d)/i,
    /Documento\s*:\s*(\d[\d\.]*\d)/i,
    /CI\s*[:\-]?\s*(\d[\d\.]*\d)/i,
  ];

  // Tus regex existentes (fallbacks)
  const prestadorActualRegexes = [
    /Prestador\s*de\s*salud\s*actual:\s*(.*?)\s*Nuevo\s*prestador\s*de\s*salud:/is,
    /Prestador\s*actual\s*:\s*(.*?)\s*(?:Nuevo\s*prestador|Documentación)/is,
  ];

  const prestadorNuevoRegexes = [
    /Nuevo\s*prestador\s*de\s*salud:\s*(.*?)\s*(?:Documentación|Motivo|Nombre)/is,
    /Nuevo\s*prestador\s*:\s*(.*?)\s*(?:Documentación|Motivo|Nombre)/is,
  ];

  const nombreRegexes = [
    /Nombre:\s*(.*?)\s*Apellido:/is,
    /Titular:\s*Nombre\s*(.*?)\s*Apellido/is,
  ];

  const apellidoRegexes = [
    /Apellido:\s*(.*?)\s*(?:Fecha\s*de\s*nacimiento:|Dirección\s*de\s*email:|Correo)/is,
  ];

  const motivoRegexes = [
    /Motivo\s*de\s*la\s*solicitud:\s*(.*?)\s*(?:Declaración\s*jurada:|Nota\s*de\s*solicitud:|Documentación)/is,
    /Causal\s*:\s*(.*?)\s*(?:Declaración|Documentación)/is,
  ];

  const firstMatch = (regexes) => {
    for (const rx of regexes) {
      const m = text.match(rx);
      if (m && m[1]) return m[1].toString();
    }
    return "";
  };

  // --- Nro Doc ---
  const nroDocRaw = firstMatch(nroDocRegexes);
  if (nroDocRaw) data.nroDocumento = nroDocRaw.replace(/\./g, "").trim();

  // --- Prestador ACTUAL: primero un match "estricto" que corta antes de tokens sospechosos ---
  const paStrict = text.match(
    /Prestador\s*de\s*salud\s*actual:\s*\*?\s*([\s\S]*?)(?=\s+(?:Nuevo\s*prestador|Documentaci[oó]n\b|Datos\b|Usuario\b|Oficina\b|\d+\s+de\s+\d+|$))/i
  );
  if (paStrict && paStrict[1]) {
    data.prestadorActual = sanitizeProvider(paStrict[1]);
  } else {
    const prestadorActualRaw = firstMatch(prestadorActualRegexes);
    if (prestadorActualRaw) data.prestadorActual = sanitizeProvider(prestadorActualRaw);
  }

  // --- Prestador NUEVO: igual estrategia "estricta" ---
  const pnStrict = text.match(
    /Nuevo\s*prestador\s*(?:de\s*salud)?:\s*\*?\s*([\s\S]*?)(?=\s+(?:doc-|https?:|Apia\b|\S+\.pdf|\d+\s+de\s+\d+|Documentaci[oó]n\b|Datos\b|Usuario\b|Oficina\b)|$)/i
  );
  if (pnStrict && pnStrict[1]) {
    data.prestadorNuevo = sanitizeProvider(pnStrict[1]);
  } else {
    const prestadorNuevoRaw = firstMatch(prestadorNuevoRegexes);
    if (prestadorNuevoRaw) data.prestadorNuevo = sanitizeProvider(prestadorNuevoRaw);
  }

  // --- Nombre, Apellido, Motivo (como ya tenías) ---
  const nombreRaw = firstMatch(nombreRegexes);
  if (nombreRaw) data.nombre = nombreRaw.replace(/\*/g, "").trim();

  const apellidoRaw = firstMatch(apellidoRegexes);
  if (apellidoRaw) data.apellido = apellidoRaw.replace(/\*/g, "").trim();

  const motivoRaw = firstMatch(motivoRegexes);
  if (motivoRaw) data.motivo = motivoRaw.replace(/\*/g, "").trim();

  // --- Identificador de la gestión ---
  const gestMatch = text.match(/Identificador\s*de\s*la\s*gesti[oó]n\s*:\s*([A-Za-z0-9_]+)/i);
  if (gestMatch && gestMatch[1]) {
    data.gestionId = gestMatch[1].trim(); // ej: hlh_prv_chg_22347
    const parts = data.gestionId.split("_");
    const num = parts.length >= 4 ? parts[3] : (data.gestionId.match(/\d+/)?.[0] || "");
    data.gestionNumero = (num || "").trim();
  }

  return data;
}


  function clearArtifacts(str) {
    return str.replace(/\*/g, "").replace(/\s{2,}/g, " ").trim();
  }

  function handleFieldChange(field, value) {
    setExtractedData((prev) => ({ ...prev, [field]: value }));
  }

  function onSaveProgress() {
    const ok = safeSave(getCurrentStorageKey());
    if (!ok) alert("No se pudo guardar localmente.");
  }

  function onClearAll() {
    setFile(null);
    setExtractedData(initialExtractedData);
    setExpedienteNro("");
    setCheckedItems(new Set());
    setPdfMeta({ pages: 0 });
    setError("");
    setFojas(INITIAL_FOJAS);
  }

  function buildSummaryString() {
    const d = extractedData;
    const lines = [
      `Asunto: ${asuntoText}`,
      `CI: ${d.nroDocumento || "-"}`,
      `Nombre: ${d.nombre || "-"}`,
      `Apellido: ${d.apellido || "-"}`,
      `Prestador actual: ${d.prestadorActual || "-"}`,
      `Nuevo prestador: ${d.prestadorNuevo || "-"}`,
      `Motivo: ${d.motivo || "-"}`,
      `Nº de expediente: ${expedienteNro || "-"}`,
      "",
      "Checklist:",
      ...currentChecklist.map((item) => `[${checkedItems.has(item) ? "x" : " "}] ${item}`),
    ];
    return lines.join("\n");
  }

  async function onCopyAll() {
    try {
      await navigator.clipboard.writeText(buildSummaryString());
    } catch (_) {
      // fallback silencioso
    }
  }

  function onExportPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40;
    let y = 48;

    doc.setFontSize(16);
    doc.text("Guía de Trámite – Cambio Mutual", left, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, left, (y += 16));
    if (file?.name) doc.text(`Archivo: ${file.name}${pdfMeta.pages ? ` (${pdfMeta.pages} pág.)` : ""}`, left, (y += 14));

    // Datos principales
    y += 14;
    doc.setFontSize(12);
    doc.text("Datos extraídos", left, y);
    y += 6;

    const d = extractedData;
    const rows = [
      ["CI", d.nroDocumento || "-"],
      ["Nombre", d.nombre || "-"],
      ["Apellido", d.apellido || "-"],
      ["Prestador actual", d.prestadorActual || "-"],
      ["Nuevo prestador", d.prestadorNuevo || "-"],
      ["Motivo", d.motivo || "-"],
      ["Nº de expediente", expedienteNro || "-"],
      ["Asunto", asuntoText || "-"],
    ];

    doc.autoTable({
      startY: y + 8,
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 59, 105] },
      margin: { left },
    });

    // Checklist
    const afterFirst = doc.lastAutoTable.finalY + 18;
    doc.setFontSize(12);
    doc.text("Checklist", left, afterFirst);

    const checklistRows = currentChecklist.map((item) => [checkedItems.has(item) ? "✔" : "", item]);
    doc.autoTable({
      startY: afterFirst + 8,
      head: [["Hecho", "Requisito"]],
      body: checklistRows,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [25, 59, 105] },
      margin: { left },
      columnStyles: { 0: { cellWidth: 40 } },
    });

    const filename = `guia_expediente_${expedienteNro || d.nroDocumento || "sin_nro"}.pdf`;
    doc.save(filename);
  }

  // --- Paso 4: helpers ---
  const orderKeys = FOJA_DOCS.map((d) => d.key);

  function parseIntOrNull(v) {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(String(v).replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? null : n;
  }

  function fsRangeStr({ from, to }) {
    const f = parseIntOrNull(from);
    const t = parseIntOrNull(to);
    if (f !== null && t !== null) {
      if (t === f) return `Fs. ${f}`;
      return `Fs. ${f} a Fs. ${t}`;
    }
    if (f !== null) return `Fs. ${f}`;
    return "Fs. ?";
  }

  function handleFojaChange(key, field, rawValue) {
    const value = rawValue.replace(/[^0-9]/g, "");
    setFojas((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function handleFojaFromBlur(key) {
    setFojas((prev) => {
      const f = parseIntOrNull(prev[key].from);
      const t = parseIntOrNull(prev[key].to);
      const next = { ...prev };
      if (f !== null && t !== null && t < f) {
        next[key] = { ...prev[key], to: String(f) };
      }
      return next;
    });
  }

  function handleFojaToBlur(key) {
    // clamp local
    setFojas((prev) => {
      const f = parseIntOrNull(prev[key].from);
      const t = parseIntOrNull(prev[key].to);
      const next = { ...prev };
      if (f !== null && t !== null && t < f) {
        next[key] = { ...prev[key], to: String(f) };
      }
      return next;
    });

    // autocompletar siguiente fila
    const idx = orderKeys.indexOf(key);
    if (idx === -1 || idx === orderKeys.length - 1) return;
    const toVal = parseIntOrNull(fojas[key].to);
    if (toVal === null) return;
    const nextKey = orderKeys[idx + 1];
    const nextFromVal = parseIntOrNull(fojas[nextKey].from);
    if (nextFromVal === null) {
      setFojas((prev) => ({
        ...prev,
        [nextKey]: { ...prev[nextKey], from: String(toVal + 1) },
      }));
    }
  }

  const finalizacionText = useMemo(() => {
    const { prestadorActual, prestadorNuevo, nombre, apellido, nroDocumento } = extractedData;
    const rCI = fsRangeStr(fojas.ci);
    const rForm = fsRangeStr(fojas.form);
    const rDocs = fsRangeStr(fojas.docs);
    const rConsulta = fsRangeStr(fojas.consulta);
    const rCorreo = fsRangeStr(fojas.correo);

    const docu = `Documentación adjunta de ${rCI} documento de identidad del titular, de ${rForm} formulario de cambio de prestador asistencial, de ${rDocs} documentación aportada por el titular, de ${rConsulta} consulta de afiliación mutual detallada y ${rCorreo} correo electrónico donde luce enviada la vista electrónica.`;

    const cierre = `Pase a espera por transcurso de plazo de vista.`;

    if (isIncumplimiento) {
      const encabezadoInc = `Se da inicio a trámite de cambio de prestador de salud por dificultades de accesibilidad por incumplimiento de los tiempos de espera de ${prestadorActual || "-"} a ${prestadorNuevo || "-"}, a solicitud de ${nombre || "-"} ${apellido || "-"} Do ${nroDocumento || "-"}`;
      return `${encabezadoInc}\n${docu}\n${cierre}`;
    } else {
      const encabezadoOtro = `Se da inicio a trámite de cambio mutual por problemas asistenciales que conllevan a la pérdida de confianza en su prestador actual, de ${prestadorActual || "-"} a ${prestadorNuevo || "-"}, a solicitud de ${nombre || "-"} ${apellido || "-"} Do ${nroDocumento || "-"}.`;
      const concordancia = `La documentación adjunta en esta actuación concuerda fielmente con la documentación obtenida del BPMS y la información de sistema que tuve a la vista.`;
      return `${encabezadoOtro}\n${docu}\n${concordancia}\n${cierre}`;
    }
  }, [extractedData, fojas, isIncumplimiento]);

  const vtiggerFinalText = useMemo(() => {
  const caso = extractedData.gestionNumero;
  const exp = (expedienteNro || "").trim();

  const expLine = exp ? `Se ingresó expediente APIA: ${exp}. ` : "";

  if (vtiggerModo === "virtual") {
    // Virtual: agrega la línea del expediente + texto virtual + (Caso BPMS si existe) + cierre
    const rest = `${caso ? `Caso BPMS ${caso}. ` : ""}Se dio vista al prestador de salud saliente.`;
    return `${expLine}Solicita cambio mutual a través de formulario en línea, desde su usuario personal.\n${rest}`;
  }

  // Sucursal: agrega la línea del expediente + (Caso BPMS si existe) + cierre
  const rest = `${caso ? `Caso BPMS ${caso}. ` : ""}Se dio vista al prestador de salud saliente.`;
  return `${expLine}${rest}`;
}, [extractedData.gestionNumero, vtiggerModo, expedienteNro]);



  const checkedCount = checkedItems.size;
  const totalCount = currentChecklist.length;

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <SectionCard title="Procesador de Expedientes">
        <p className="text-sm text-gray-600 mb-4">
          Cargue un PDF de solicitud para generar una guía de trabajo interactiva. Puede editar los datos extraídos antes de continuar.
        </p>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`p-6 md:p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragActive ? "border-secondary bg-primary/20" : "border-primary bg-primary/10"
          }`}
        >
          <input {...getInputProps()} />
          <i className="fas fa-file-pdf text-5xl text-primary mb-3" />
          {isProcessing ? (
            <p className="text-gray-800">
              <i className="fas fa-spinner fa-spin mr-2" />Procesando PDF...
            </p>
          ) : file ? (
            <p className="text-gray-800">
              Archivo: <strong>{file.name}</strong>
              {pdfMeta.pages ? ` • ${pdfMeta.pages} pág.` : ""}
            </p>
          ) : (
            <p className="text-gray-700">Arrastre un PDF aquí, o haga clic para seleccionar.</p>
          )}
        </div>
        {error && (
          <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
        )}

        {/* Acciones rápidas */}
        {/* <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSaveProgress}
            className="px-4 py-2 rounded-md bg-secondary text-white shadow hover:opacity-90"
          >
            Guardar progreso
          </button>
          <button
            type="button"
            onClick={onCopyAll}
            disabled={!hasData}
            className={`px-4 py-2 rounded-md shadow ${
              hasData ? "bg-primary text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Copiar resumen
          </button>
          <button
            type="button"
            onClick={onExportPDF}
            disabled={!hasData}
            className={`px-4 py-2 rounded-md shadow ${
              hasData ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Exportar guía (PDF)
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div> */}
        {/* Vista previa del PDF */}
        {filePreviewURL && (
          <div className="mt-6">
            <p className="text-xs text-gray-500 mb-2">Vista previa rápida</p>
            <object data={filePreviewURL} type="application/pdf" className="w-full h-96 rounded border" />
          </div>
        )}
      </SectionCard>

      {/* Cards de Trabajo */}
      {(hasData || file) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 0: Datos extraídos / editables */}
          <SectionCard title="Paso 0: Revisar y corregir datos extraídos">
            <div className="space-y-4">
              <EditableField label="Nro. de documento" value={extractedData.nroDocumento} onChange={(v) => handleFieldChange("nroDocumento", v)} />
              <EditableField label="Nombre" value={extractedData.nombre} onChange={(v) => handleFieldChange("nombre", v)} />
              <EditableField label="Apellido" value={extractedData.apellido} onChange={(v) => handleFieldChange("apellido", v)} />
              <EditableField label="Prestador actual" value={extractedData.prestadorActual} onChange={(v) => handleFieldChange("prestadorActual", v)} />
              <EditableField label="Nuevo prestador" value={extractedData.prestadorNuevo} onChange={(v) => handleFieldChange("prestadorNuevo", v)} />
              <EditableTextArea label="Motivo" value={extractedData.motivo} onChange={(v) => handleFieldChange("motivo", v)} />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Asunto</p>
                <ClipboardCopy textToCopy={asuntoText} />
              </div>
              <ValidationHints data={extractedData} />
            </div>
          </SectionCard>

          {/* CARD 1: Verificación */}
          <SectionCard title={`Paso 1: Verificación (${extractedData.motivo || "Sin motivo"})`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Completado: <span className="font-semibold">{checkedCount}/{totalCount}</span>
              </p>
              <button
                type="button"
                onClick={() => setCheckedItems(new Set(currentChecklist))}
                className="text-xs px-3 py-1 rounded bg-gray-100 border hover:bg-gray-200"
              >
                Marcar todo
              </button>
            </div>
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

          {/* CARD 2: Iniciar Expediente APIA */}
          <SectionCard title="Paso 2: Iniciar Expediente APIA">
            <div className="space-y-4">
              <InfoItem label="Oficina" value="1481 GUDE Deslocalizado" />
              <InfoItem label="Tipo de expediente" value="Cambio Mutual" />
              <CopyItem label="Asunto" textToCopy={asuntoText} />
              <CopyItem label="Agregar Persona" textToCopy={extractedData.nroDocumento} />
              <InfoItem label="Seleccionar" value="Confidencial" />
              <InfoItem label="Realizar actuación, marcando" value="Sí" />
              <InputItem
                label="Nro de expediente"
                value={expedienteNro}
                onChange={(e) => setExpedienteNro(e.target.value)}
                placeholder="Pegue el nro. de expediente aquí"
              />
              <InfoItem label="Acción final" value="Descargar carátula" />
            </div>
          </SectionCard>

          {/* CARD 3: BPMS */}
          <SectionCard title="Paso 3: BPMS">
            <div className="space-y-4">
              <InfoItem label="Acción" value="Selecciono fecha de notificación" />
              <CopyItem label="Nro. de trámite" textToCopy={expedienteNro} disabled={!expedienteNro} />

              {/* (C) Mostrar este bloque solo si el motivo es exactamente "Incumplimiento plazos prestador" y hay texto definido */}
              {isIncumplimiento && DYNAMIC_TEXTS.incumplimientoCorreo && (
                <CopyItem label="Texto para correo (Incumplimiento plazos prestador)" textToCopy={DYNAMIC_TEXTS.incumplimientoCorreo} />
              )}

              {/* Estas acciones se ven SIEMPRE, independientemente del motivo */}
              <InfoItem label="Acción" value="Envío correo y lo descargo para próxima etapa." />
              <InfoItem label="Acción" value="Finalizo el BPMS" />
            </div>
          </SectionCard>

          {/* CARD 4: Finalización APIA */}
          <SectionCard title="Paso 4: Finalización APIA">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Complete los rangos de fojas de la documentación cargada en la otra aplicación. La fila siguiente se autocompleta cuando cierra el rango de la anterior.</p>

              <div className="space-y-3">
                {FOJA_DOCS.map(({ key, label }) => (
                  <FojaRangeRow
                    key={key}
                    label={label}
                    value={fojas[key]}
                    onChange={(field, v) => handleFojaChange(key, field, v)}
                    onFromBlur={() => handleFojaFromBlur(key)}
                    onToBlur={() => handleFojaToBlur(key)}
                  />
                ))}
              </div>

              <div className="pt-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Texto</p>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCopy textToCopy={finalizacionText} />
                </div>
                
              </div>
            </div>
          </SectionCard>

          {/* CARD 5: VTigger */}
          <SectionCard title="Paso 5: VTigger">
            <div className="space-y-4">
              {/* Nro. de documento arriba, con copia */}
              <CopyItem
                label="Nro. de documento"
                textToCopy={extractedData.nroDocumento}
                disabled={!extractedData.nroDocumento}
              />

              {/* Selector de modo */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Modo</p>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="vtiggerMode"
                      value="sucursal"
                      checked={vtiggerModo === "sucursal"}
                      onChange={() => setVtiggerModo("sucursal")}
                    />
                    <span>Sucursal</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="vtiggerMode"
                      value="virtual"
                      checked={vtiggerModo === "virtual"}
                      onChange={() => setVtiggerModo("virtual")}
                    />
                    <span>Virtual</span>
                  </label>
                </div>
              </div>

              {/* Texto (C) según modo, usando Caso BPMS */}
              <CopyItem
                label="Texto"
                textToCopy={vtiggerFinalText}
                disabled={!extractedData.gestionNumero}
              />
            </div>
          </SectionCard>

        </div>
      )}
    </main>
  );
}

// --- Componentes Auxiliares ---

const ChecklistItem = ({ text, isChecked, onToggle }) => (
  <div
    className="flex items-start space-x-3 cursor-pointer group p-2 rounded-md hover:bg-primary/10"
    onClick={onToggle}
  >
    <i
      className={`far ${isChecked ? "fa-check-square text-primary" : "fa-square text-gray-400"} mt-1 group-hover:text-primary transition-colors`}
    />
    <p className={`text-sm transition-colors ${isChecked ? "line-through text-gray-500" : "text-gray-700"}`}>{text}</p>
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
      <p className="text-sm text-gray-400 italic font-mono bg-gray-100 p-2 rounded border">(esperando Nro. de expediente)</p>
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

const EditableField = ({ label, value, onChange }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 mt-0 block w-full text-sm px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
      />
      <ClipboardCopy textToCopy={value || ""} />
    </div>
  </div>
);

const EditableTextArea = ({ label, value, onChange }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="mt-0 block w-full text-sm px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
    />
  </div>
);

function ValidationHints({ data }) {
  const issues = [];

  if (data.nroDocumento && !/^\d{6,}$/.test(data.nroDocumento)) {
    issues.push("La CI debería contener solo dígitos (6+). Revise puntos o guiones.");
  }
  if (!data.prestadorActual) issues.push("Falta el prestador actual.");
  if (!data.prestadorNuevo) issues.push("Falta el nuevo prestador.");
  if (!data.nombre || !data.apellido) issues.push("Nombre y apellido incompletos.");
  if (!data.gestionNumero) issues.push("No se detectó el 'Caso BPMS' (Identificador de la gestión). Revise el PDF.");

  if (issues.length === 0)
    return (
      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">Todo listo. Los campos básicos están completos.</p>
    );

  return (
    <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 list-disc pl-5">
      {issues.map((it, idx) => (
        <li key={idx}>{it}</li>
      ))}
    </ul>
  );
}

const FojaRangeRow = ({ label, value, onChange, onFromBlur, onToBlur }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-3">
    <div className="md:col-span-6">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
    </div>
    <div className="md:col-span-3">
      <p className="text-xs font-medium text-gray-500">Foja desde</p>
      <input
        type="text"
        inputMode="numeric"
        value={value.from}
        onChange={(e) => onChange("from", e.target.value)}
        onBlur={onFromBlur}
        className="mt-1 w-full text-sm px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="1"
      />
    </div>
    <div className="md:col-span-3">
      <p className="text-xs font-medium text-gray-500">Foja hasta</p>
      <input
        type="text"
        inputMode="numeric"
        value={value.to}
        onChange={(e) => onChange("to", e.target.value)}
        onBlur={onToBlur}
        className="mt-1 w-full text-sm px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="2"
      />
    </div>
  </div>
);

export default ExpedientesPage;
