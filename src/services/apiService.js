/* ========================================================================== */
/* Archivo: frontend/src/services/apiService.js (ACTUALIZADO LOGS)           */
/* ========================================================================== */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
    let errorMsg = `Error: ${response.status} ${response.statusText}`;
    let responseData = null;
    try {
        if (response.status === 204) { return {}; }
        responseData = await response.json();
    } catch (jsonError) {
        if (!response.ok && response.status !== 204) { throw new Error(errorMsg); }
        if (response.status !== 204) console.warn("Could not parse JSON response, but status was OK.");
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

export async function createExpedienteApi(expedienteData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/expedientes/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expedienteData),
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
        const validatedData = (Array.isArray(data) ? data : []).map(exp => ({
            ...exp,
            oficio: exp.oficio ?? null,
            juzgado: exp.juzgado ?? null,
            departamento: exp.departamento ?? null,
            fecha_recibido: exp.fecha_recibido ?? null,
        }));
        return { data: validatedData, error: null };
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

export async function deleteExpedienteApi(expedienteId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/expedientes/${expedienteId}`, {
            method: 'DELETE',
        });
        await handleResponse(response);
        return { data: { message: "Expediente eliminado" }, error: null };
    } catch (error) {
        console.error("Error en deleteExpedienteApi:", error);
        return { data: null, error: error.message || "Error desconocido al eliminar expediente." };
    }
}

/**
 * Envía un log de acceso al backend.
 * El backend se encarga de la IP. El frontend envía la descripción y detalles.
 * @param {object} logInput - Datos del log a enviar.
 * @param {string} logInput.action_description - Descripción de la acción.
 * @param {string|null} [logInput.user_identifier="usuario_anonimo"] - Identificador del usuario.
 * @param {object} [logInput.details={}] - Detalles adicionales.
 * @returns {Promise<object>} - Un objeto { data: ..., error: ... }
 */
export async function createAccessLogApi(logInput) {
    // El timestamp se genera en el backend según tu descripción
    // La IP se obtiene en el backend
    const payload = {
        action_description: logInput.action_description,
        user_identifier: logInput.user_identifier || "usuario_anonimo", // Default si no se provee
        details: logInput.details || {}, // Default a objeto vacío
    };
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/logs/access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await handleResponse(response);
        console.log("Log de acceso enviado:", data);
        return { data, error: null };
    } catch (error) {
        console.error("Error en createAccessLogApi:", error);
        // No interrumpir al usuario si el log falla
        return { data: null, error: error.message || "Error al enviar log de acceso." };
    }
}

export async function getAccessLogsApi(skip = 0, limit = 100) {
    try {
        const url = new URL(`${API_BASE_URL}/api/v1/logs/access`);
        url.searchParams.append('skip', skip);
        url.searchParams.append('limit', limit);
        const response = await fetch(url.toString(), { method: 'GET' });
        const data = await handleResponse(response);
        return { data: Array.isArray(data) ? data : [], error: null };
    } catch (error) {
        console.error("Error en getAccessLogsApi:", error);
        return { data: [], error: error.message || "Error desconocido al obtener logs de acceso." };
    }
}

/**
 * Llama al backend para que este calcule la distancia de manejo usando la API de Google.
 * @param {{lat: number, lng: number}} origin - Coordenadas de origen.
 * @param {{lat: number, lng: number}} destination - Coordenadas de destino.
 * @returns {Promise<object>} - Un objeto { data: ..., error: ... }
 */
export async function getDrivingDistanceViaBackend(origin, destination) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/geo/distance-matrix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin, destination }),
        });
        const data = await handleResponse(response);
        return { data, error: null };
    } catch (error) {
        console.error("Error en getDrivingDistanceViaBackend:", error);
        return { data: null, error: error.message || "Error al contactar el backend para calcular la distancia." };
    }
}