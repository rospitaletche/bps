/* ========================================================================== */
/* Archivo: frontend/src/services/apiService.js                              */
/* ========================================================================== */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
    let errorMsg = `Error: ${response.status} ${response.statusText}`;
    let responseData = null;
    try {
        if (response.status === 204) { return {}; } // No content para DELETE exitoso
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
        await handleResponse(response); // handleResponse maneja el 204
        return { data: { message: "Expediente eliminado" }, error: null };
    } catch (error) {
        console.error("Error en deleteExpedienteApi:", error);
        return { data: null, error: error.message || "Error desconocido al eliminar expediente." };
    }
}