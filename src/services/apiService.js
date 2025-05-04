/* ========================================================================== */
/* Archivo: frontend/src/services/apiService.js (ACTUALIZADO)                */
/* ========================================================================== */

// Leer la URL base de la API desde las variables de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Fallback por si no está definida

/**
 * Función genérica para manejar errores de fetch y parseo JSON.
 * @param {Response} response - La respuesta del fetch.
 * @returns {Promise<object>} - Los datos JSON o lanza un error.
 */
async function handleResponse(response) {
    let errorMsg = `Error: ${response.status} ${response.statusText}`;
    let responseData = null;

    try {
        // Intentar parsear JSON incluso en errores
        // Si el status es 204 (No Content), no habrá cuerpo
        if (response.status === 204) {
            return {}; // Devolver objeto vacío para 204
        }
        responseData = await response.json();
    } catch (jsonError) {
        if (!response.ok) {
            throw new Error(errorMsg);
        }
        console.warn("Could not parse JSON response, but status was OK.");
        return {};
    }

    if (!response.ok) {
        if (responseData.detail && Array.isArray(responseData.detail)) {
            errorMsg = responseData.detail.map(err => `${err.loc.slice(-1)[0]}: ${err.msg}`).join('; ');
        } else if (responseData.detail) {
            errorMsg = responseData.detail;
        }
        throw new Error(errorMsg);
    }

    return responseData;
}


/**
 * Llama al endpoint para analizar el PDF.
 * @param {File} pdfFile - El archivo PDF a analizar.
 * @returns {Promise<object>} - Un objeto { data: ..., error: ... }
 */
export async function analyzePdfApi(pdfFile) {
    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/analyze-pdf`, {
            method: 'POST',
            body: formData,
        });
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
 * @returns {Promise<object>} - Un objeto { data: ..., error: ... }
 */
export async function createExpedienteApi(expedienteData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/expedientes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expedienteData),
        });
        const data = await handleResponse(response);
        return { data, error: null };
    } catch (error) {
        console.error("Error en createExpedienteApi:", error);
        return { data: null, error: error.message || "Error desconocido al guardar expediente." };
    }
}

/**
 * Llama al endpoint para obtener la lista de expedientes.
 * @param {number} skip - Número de registros a saltar.
 * @param {number} limit - Número máximo de registros a devolver.
 * @returns {Promise<object>} - Un objeto { data: [], error: ... }
 */
export async function getExpedientesApi(skip = 0, limit = 100) {
    try {
        // Construir URL con query parameters
        const url = new URL(`${API_BASE_URL}/api/v1/expedientes/`);
        url.searchParams.append('skip', skip);
        url.searchParams.append('limit', limit);
        // Podrías añadir aquí el filtro ?trabajado=true/false si el backend lo soporta

        const response = await fetch(url.toString(), { // Usar url.toString()
            method: 'GET',
        });
        const data = await handleResponse(response);
        // Asegurarse que data sea siempre un array
        return { data: Array.isArray(data) ? data : [], error: null };
    } catch (error) {
        console.error("Error en getExpedientesApi:", error);
        return { data: [], error: error.message || "Error desconocido al obtener expedientes." };
    }
}

/**
 * Llama al endpoint para actualizar el estado 'trabajado' de un expediente.
 * @param {number} expedienteId - ID del expediente a actualizar.
 * @param {boolean} trabajado - Nuevo estado 'trabajado'.
 * @returns {Promise<object>} - Un objeto { data: ..., error: ... }
 */
export async function updateTrabajadoStatusApi(expedienteId, trabajado) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/expedientes/${expedienteId}/trabajado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(trabajado), // FastAPI espera el booleano directamente en el cuerpo para este endpoint específico
        });
        const data = await handleResponse(response);
        return { data, error: null };
    } catch (error) {
        console.error("Error en updateTrabajadoStatusApi:", error);
        return { data: null, error: error.message || "Error desconocido al actualizar estado." };
    }
}