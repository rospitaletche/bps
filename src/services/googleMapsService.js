/* ========================================================================== */
/* Archivo: frontend/src/services/googleMapsService.js (API ROUTES FIX)      */
/* ========================================================================== */
/**
 * Realiza una llamada a la API de Geocodificación de Google Maps para obtener coordenadas.
 * @param {string} address La dirección a geocodificar.
 * @param {string} apiKey La clave de API de Google Maps del usuario.
 * @returns {Promise<{lat: number, lng: number, status: string, formatted_address: string}|{error: string, status: string}>}
 */
export async function geocodeAddress(address, apiKey) {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        status: 'OK',
        formatted_address: data.results[0].formatted_address,
      };
    } else {
      console.warn(`Geocoding failed for address "${address}": ${data.status}`, data.error_message || '');
      return {
        error: `No se encontraron resultados o hubo un error: ${data.status}`,
        status: data.status,
      };
    }
  } catch (error) {
    console.error('Error fetching geocoding data:', error);
    return {
      error: 'Error de red al contactar la API de Google.',
      status: 'NETWORK_ERROR',
    };
  }
}

/**
 * Obtiene la distancia y duración de viaje entre dos puntos usando la nueva Routes API.
 * @param {{lat: number, lng: number}} origin - Coordenadas de origen.
 * @param {{lat: number, lng: number}} destination - Coordenadas de destino.
 * @param {string} apiKey - La clave de API de Google Maps.
 * @returns {Promise<{distance: string, duration: string, status: string}|{error: string, status: string}>}
 */
export async function getDrivingDistance(origin, destination, apiKey) {
  // Nuevo endpoint para la Routes API (computeRouteMatrix)
  const url = 'https://routes.googleapis.com/v1:computeRouteMatrix';
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    // Especificar los campos que queremos en la respuesta para optimizar la llamada
    'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status',
  };

  const body = {
    origins: [
      {
        waypoint: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng,
            },
          },
        },
      },
    ],
    destinations: [
      {
        waypoint: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
      },
    ],
    travelMode: 'DRIVE',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Manejar errores a nivel superior de la API (ej. clave inválida, problemas de facturación)
    if (data.error) {
      console.warn('Routes API request failed:', data.error.message);
      return { error: data.error.message, status: data.error.status || 'REQUEST_FAILED' };
    }

    // La respuesta es un array de elementos de la matriz de rutas.
    if (Array.isArray(data) && data.length > 0) {
      const element = data[0]; // Solo tenemos un origen y un destino, tomamos el primer elemento.
      
      // Un código de estado 0 significa que la ruta específica se calculó con éxito.
      if (element.status && element.status.code === 0) {
        const distanceKm = (element.distanceMeters / 1000).toFixed(1);
        
        let durationText = 'N/A';
        if (element.duration) {
          // La duración es una cadena como "345s". Quitamos la 's' y la parseamos.
          const durationSeconds = parseInt(element.duration.slice(0, -1), 10);
          const minutes = Math.floor(durationSeconds / 60);
          const seconds = durationSeconds % 60;
          durationText = `${minutes} min ${seconds} s`;
        }

        return {
          distance: `${distanceKm} km`,
          duration: durationText,
          status: 'OK',
        };
      } else {
         // Manejar errores para una ruta específica (ej. no se encontró ruta).
         const errorMessage = element.status?.message || 'La ruta específica no pudo ser calculada.';
         console.warn('Routes API failed for a specific route:', errorMessage);
         return { error: errorMessage, status: 'API_ROUTE_ERROR' };
      }
    } else {
      // Manejar casos donde la respuesta no es un array o está vacía.
      console.warn('Routes API returned an unexpected response format:', data);
      return { error: 'Respuesta inesperada de la API de Routes.', status: 'UNEXPECTED_RESPONSE' };
    }
  } catch (error) {
    console.error('Error fetching driving distance:', error);
    return { error: 'Error de red al contactar la API de Routes.', status: 'NETWORK_ERROR' };
  }
}
