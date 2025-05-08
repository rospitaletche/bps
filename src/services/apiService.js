/* ========================================================================== */
/* Archivo: frontend/src/services/apiService.js (ACTUALIZADO)                */
/* ========================================================================== */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
    let errorMsg = `Error: ${response.status} ${response.statusText}`;
    let responseData = null;
    try {
        if (response.status === 204) { return {}; }
        responseData = await response.json();
    } catch (jsonError) {
        if (!response.ok) { throw new Error(errorMsg); }
        console.warn("Could not parse JSON response, but status was OK.");
        return {};
    }
    if (!response.ok) {
        if (responseData.detail && Array.isArray(responseData.detail)) {
             try { errorMsg = responseData.detail.map(err => `${err.loc.join('.')} (${err.type}): ${err.msg}`).join('; '); } catch (formatError) { errorMsg = JSON.stringify(responseData.detail); }
        } else if (responseData.detail) { errorMsg = responseData.detail; }
        throw new Error(errorMsg);
    }
    return responseData;
}

export async function analyzePdfApi(pdfFile) {
    const formData = new FormData();
    formData.append('file', pdfFile);
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/analyze-pdf`, { method: 'POST', body: formData });
        const data = await handleResponse(response);
        return { data, error: null };
    } catch (error) {
        console.error("Error en analyzePdfApi:", error);
        return { data: null, error: error.message || "Error desconocido al analizar PDF." };
    }
}

/**
 * Llama al endpoint para crear un nuevo expediente.
 * @param {object} expedienteData - Datos del expediente a crear.
 * @param {string} expedienteData.expediente_nro
 * @param {boolean} expedienteData.trabajado
 * @param {number} expedienteData.id_usuario
 * @param {string | null} expedienteData.fecha_recibido - Formato YYYY-MM-DD
 * @param {string | null} expedienteData.juzgado
 * @param {string | null} expedienteData.departamento
 * @param {string | null} expedienteData.oficio
 * @returns {Promise<object>} - Un objeto { data: ..., error: ... }
 */
export async function createExpedienteApi(expedienteData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/expedientes/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviar el payload completo
            body: JSON.stringify(expedienteData),
        });
        const data = await handleResponse(response);
        return { data, error: null };
    } catch (error) {
        console.error("Error en createExpedienteApi:", error);
        return { data: null, error: error.message || "Error desconocido al guardar expediente." };
    }
}

export async function getExpedientesApi(skip = 0, limit = 100) {
    try {
        const url = new URL(`${API_BASE_URL}/api/v1/expedientes/`);
        url.searchParams.append('skip', skip); url.searchParams.append('limit', limit);
        const response = await fetch(url.toString(), { method: 'GET' });
        const data = await handleResponse(response);
        return { data: Array.isArray(data) ? data : [], error: null };
    } catch (error) {
        console.error("Error en getExpedientesApi:", error);
        return { data: [], error: error.message || "Error desconocido al obtener expedientes." };
    }
}

export async function updateTrabajadoStatusApi(expedienteId, trabajado) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/expedientes/${expedienteId}/trabajado`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trabajado),
        });
        const data = await handleResponse(response);
        return { data, error: null };
    } catch (error) {
        console.error("Error en updateTrabajadoStatusApi:", error);
        return { data: null, error: error.message || "Error desconocido al actualizar estado." };
    }
}